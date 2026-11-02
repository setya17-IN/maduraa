import pool from '../config/db.js';

const createProductsTable = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
      name VARCHAR(255) NOT NULL,
      purchase_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
      selling_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
      stock INT NOT NULL DEFAULT 0,
      unit VARCHAR(50) DEFAULT 'pcs',
      image_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  try {
    await pool.query(queryText);
    console.log('Tabel products dengan relasi categories berhasil disiapkan.');
  } catch (err) {
    console.error('Gagal membuat tabel products:', err.message);
  } finally {
    pool.end();
  }
};

createProductsTable();
