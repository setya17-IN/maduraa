import pool from '../config/db.js';

const query = `
  CREATE TABLE IF NOT EXISTS public.revoked_tokens (
    jti TEXT PRIMARY KEY,
    expires_at TIMESTAMPTZ NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires_at
    ON public.revoked_tokens (expires_at);
  ALTER TABLE public.revoked_tokens ENABLE ROW LEVEL SECURITY;
  REVOKE ALL PRIVILEGES ON TABLE public.revoked_tokens
    FROM PUBLIC, anon, authenticated;
`;

try {
  await pool.query(query);
  console.log('Tabel revoked_tokens berhasil dibuat atau sudah ada.');
} catch (error) {
  console.error('Gagal menyiapkan tabel revoked_tokens:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
