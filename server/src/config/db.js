import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseSsl ? { rejectUnauthorized: true } : false,
});

pool.on('error', (error) => {
  console.error('Unexpected database pool error:', error);
});

export default pool;
