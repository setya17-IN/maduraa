import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

const ssl = !env.databaseSsl
  ? false
  : env.nodeEnv === 'development'
    ? { rejectUnauthorized: false }
    : { rejectUnauthorized: true, ...(env.databaseCa ? { ca: env.databaseCa } : {}) };

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl,
});

pool.on('error', (error) => {
  console.error('Unexpected database pool error:', error);
});

export default pool;
