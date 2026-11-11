-- Reference schema matching the Supabase tables shown in the project schema.
-- This file describes the expected structure; it does not modify the live project.
-- Review existing columns, constraints, grants, and RLS policies before applying SQL.

-- `profiles` stores the two provisioned account roles: owner and cashier.
-- There is no public registration endpoint; create missing accounts with
-- `server/src/database/seedUsers.js`. Password values must be bcrypt hashes.
-- The seed script leaves existing passwords unchanged unless passed --reset-password.
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name VARCHAR,
  email VARCHAR UNIQUE,
  password VARCHAR,
  role VARCHAR DEFAULT 'cashier'
);

-- Keep the role constraint addition safe to rerun.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_role_allowed'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_allowed CHECK (role IS NOT NULL AND role IN ('cashier', 'owner'));
  END IF;
END
$$;

-- JWT IDs are recorded here on logout so protected routes can reject revoked tokens.
CREATE TABLE IF NOT EXISTS public.revoked_tokens (
  jti TEXT PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires_at ON public.revoked_tokens(expires_at);
ALTER TABLE public.revoked_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.revoked_tokens FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id),
  name TEXT NOT NULL,
  purchase_price NUMERIC NOT NULL DEFAULT 0,
  selling_price NUMERIC NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  unit VARCHAR,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keep existing databases compatible with controllers that update this column.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Keep the stock constraint addition safe to rerun.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_stock_nonnegative'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_stock_nonnegative CHECK (stock >= 0);
  END IF;
END
$$;

-- RLS is enabled on tables that are not read directly through the client Data API.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Direct client access to transactions is currently used by the frontend, so its RLS
-- change is deferred until matching policies and frontend behavior are ready.
-- Do not enable RLS on public.transactions in this script.
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  total_amount NUMERIC NOT NULL DEFAULT 0,
  payment_method VARCHAR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id),
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL
);

-- Keep the quantity constraint addition safe to rerun.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'transaction_items_quantity_positive'
      AND conrelid = 'public.transaction_items'::regclass
  ) THEN
    ALTER TABLE public.transaction_items
      ADD CONSTRAINT transaction_items_quantity_positive CHECK (quantity > 0);
  END IF;
END
$$;

ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction ON transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product ON transaction_items(product_id);
