import pool from '../config/db.js';

const createCategoriesTable = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  try {
    await pool.query(queryText);
    console.log('Tabel categories berhasil dibuat atau sudah ada.');
  } catch (err) {
    console.error('Gagal membuat tabel categories:', err.message);
  } finally {
    pool.end();
  }
};

createCategoriesTable();
