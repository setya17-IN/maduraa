import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';

process.env.DATABASE_URL ??= 'postgresql://test:test@127.0.0.1:5432/test';
process.env.JWT_SECRET ??= 'database-tls-test-secret-at-least-32-characters';
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'test';

const { resolveDatabaseSsl } = await import('../src/config/db.js');

test('rejects production configuration when database TLS is disabled without exposing connection details', () => {
  const connectionString = 'postgresql://private-user:private-password@db.example.test/private-db';
  let thrown;

  try {
    resolveDatabaseSsl({ databaseSsl: false, databaseCa: undefined, nodeEnv: 'production' });
  } catch (error) {
    thrown = error;
  }

  assert.ok(thrown instanceof Error);
  assert.match(thrown.message, /TLS with certificate verification is required/);
  assert.equal(thrown.message.includes(connectionString), false);
  assert.equal(thrown.message.includes('private-password'), false);
});

test('requires certificate verification for production TLS', () => {
  assert.deepEqual(resolveDatabaseSsl({ databaseSsl: true, nodeEnv: 'production' }), {
    rejectUnauthorized: true,
  });
});

test('includes the configured CA for production TLS', () => {
  const ca = 'test-certificate-authority';
  assert.deepEqual(resolveDatabaseSsl({ databaseSsl: true, databaseCa: ca, nodeEnv: 'production' }), {
    rejectUnauthorized: true,
    ca,
  });
});

test('keeps relaxed certificate verification in development', () => {
  assert.deepEqual(resolveDatabaseSsl({ databaseSsl: true, nodeEnv: 'development' }), {
    rejectUnauthorized: false,
  });
});

test('returns false when database TLS is disabled outside production', () => {
  assert.equal(resolveDatabaseSsl({ databaseSsl: false, nodeEnv: 'development' }), false);
});

test('fails startup with a clear error when NODE_ENV is unset', () => {
  const envModuleUrl = new URL('../src/config/env.js', import.meta.url).href;
  const childEnv = {
    ...process.env,
    DATABASE_URL: 'postgresql://test:test@127.0.0.1:5432/test',
    JWT_SECRET: 'database-tls-test-secret-at-least-32-characters',
    DOTENV_CONFIG_PATH: join(tmpdir(), 'missing-codex-test-env'),
  };
  delete childEnv.NODE_ENV;

  const child = spawnSync(
    process.execPath,
    ['--input-type=module', '-e', `await import(${JSON.stringify(envModuleUrl)})`],
    { cwd: resolve(tmpdir()), env: childEnv, encoding: 'utf8' },
  );

  assert.notEqual(child.status, 0);
  assert.match(child.stderr, /NODE_ENV harus ditetapkan secara eksplisit/);
  assert.equal(child.stderr.includes(childEnv.DATABASE_URL), false);
});
