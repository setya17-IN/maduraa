import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

// Tes koneksi saat startup
pool.query('SELECT NOW()')
    .then(() => console.log('✅ Database terhubung'))
    .catch((err) => console.error('❌ Gagal terhubung ke database:', err.message));

export default pool;
