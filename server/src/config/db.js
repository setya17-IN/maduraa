import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const resolveDatabaseSsl = ({ databaseSsl, databaseCa, nodeEnv }) => {
  const ssl = !databaseSsl
    ? false
    : nodeEnv === 'development'
      ? { rejectUnauthorized: false }
      : { rejectUnauthorized: true, ...(databaseCa ? { ca: databaseCa } : {}) };

  if (nodeEnv === 'production' && (!ssl || ssl.rejectUnauthorized !== true)) {
    throw new Error('Database TLS with certificate verification is required in production');
  }

  return ssl;
};

const ssl = resolveDatabaseSsl(env);

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl,
});

pool.on('error', (error) => {
  console.error('Unexpected database pool error:', error);
});

export default pool;
