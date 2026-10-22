import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Tes koneksi saat startup
pool
  .query('SELECT NOW()')
  .then(() => console.log('✅ Database terhubung'))
  .catch((err) => console.error('❌ Gagal terhubung ke database:', err.message));

export default pool;
