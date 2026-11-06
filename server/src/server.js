import { env } from './config/env.js';
import pool from './config/db.js';

const { default: app } = await import('./app.js');

const port = env.port;

let server;

try {
  await pool.query('SELECT 1');
  server = app.listen(port, () => {
    console.log(`Server backend "maduraa" berjalan di port ${port}`);
  });
} catch (error) {
  console.error('Database connection failed; server was not started:', error.message);
  await pool.end();
  process.exitCode = 1;
}

const shutdown = async (signal) => {
  console.log(`${signal} received; shutting down`);
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
  await pool.end();
};

process.once('SIGINT', () =>
  shutdown('SIGINT').catch((error) => console.error('Shutdown failed:', error)),
);
process.once('SIGTERM', () =>
  shutdown('SIGTERM').catch((error) => console.error('Shutdown failed:', error)),
);
