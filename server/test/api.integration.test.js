import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import jwt from 'jsonwebtoken';

process.env.DATABASE_URL ??= 'postgresql://test:test@127.0.0.1:5432/test';
process.env.JWT_SECRET ??= 'integration-test-secret-that-is-at-least-32-characters';

const [{ default: app }, { default: pool }, { generateAuthToken }] = await Promise.all([
  import('../src/app.js'),
  import('../src/config/db.js'),
  import('../src/utils/authSecurity.js'),
]);

let server;
let baseUrl;
let revokedJtiForTest = null;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
});

beforeEach((t) => {
  const originalQuery = pool.query.bind(pool);
  t.mock.method(pool, 'query', async (query, ...args) => {
    if (typeof query === 'string' && query.includes('FROM revoked_tokens')) {
      const isRevoked = revokedJtiForTest !== null && args[0]?.[0] === revokedJtiForTest;
      return { rowCount: isRevoked ? 1 : 0, rows: isRevoked ? [{}] : [] };
    }
    return originalQuery(query, ...args);
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
  await pool.end();
});

const tokenFor = (role) =>
  generateAuthToken({
    id: 'a3bb189e-8bf9-3888-9912-ace4e6543002',
    email: `${role}@example.com`,
    role,
  });

describe('HTTP API middleware integration', () => {
  it('serves the health endpoint', async () => {
    const response = await fetch(`${baseUrl}/health`);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).status, 'ok');
  });

  it('rejects missing and invalid bearer tokens', async () => {
    const missing = await fetch(`${baseUrl}/products`);
    assert.equal(missing.status, 401);

    const invalid = await fetch(`${baseUrl}/products`, {
      headers: { Authorization: 'Bearer invalid-token' },
    });
    assert.equal(invalid.status, 401);
  });

  it('rejects expired bearer tokens', async () => {
    const expiredToken = jwt.sign(
      { id: 'a3bb189e-8bf9-3888-9912-ace4e6543002', role: 'owner' },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: -1, jwtid: 'expired-test-token' },
    );
    const response = await fetch(`${baseUrl}/products`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    assert.equal(response.status, 401);
  });

  it('returns 404 for the removed registration endpoint', async () => {
    const response = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User', email: 'test@example.com', password: 'password' }),
    });
    assert.equal(response.status, 404);
  });

  it('rejects a token whose jti is present in revoked_tokens', async () => {
    const token = tokenFor('cashier');
    revokedJtiForTest = jwt.decode(token).jti;

    try {
      const response = await fetch(`${baseUrl}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(response.status, 401);
    } finally {
      revokedJtiForTest = null;
    }
  });

  it('blocks cashiers from owner routes before database access', async () => {
    const response = await fetch(`${baseUrl}/dashboard/summary`, {
      headers: { Authorization: `Bearer ${tokenFor('cashier')}` },
    });
    assert.equal(response.status, 403);
  });

  it('rejects a valid token with an unknown role', async () => {
    const response = await fetch(`${baseUrl}/products`, {
      headers: { Authorization: `Bearer ${tokenFor('manager')}` },
    });
    assert.equal(response.status, 403);
  });

  it('validates protected route input before database access', async () => {
    const response = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenFor('owner')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Product', selling_price: -1 }),
    });
    assert.equal(response.status, 400);
  });
});
