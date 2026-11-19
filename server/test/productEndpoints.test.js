import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';

process.env.DATABASE_URL ??= 'postgresql://test:test@127.0.0.1:5432/test';
process.env.JWT_SECRET ??= 'product-endpoint-test-secret-at-least-32-characters';

const [{ default: app }, { default: pool }, { generateAuthToken }] = await Promise.all([
  import('../src/app.js'),
  import('../src/config/db.js'),
  import('../src/utils/authSecurity.js'),
]);

const productId = 'a3bb189e-8bf9-3888-9912-ace4e6543002';
const product = {
  id: productId,
  name: 'Produk Uji',
  selling_price: '15000',
  image_url: null,
};

let server;
let baseUrl;
let handleProductQuery;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api/v1/products`;
});

beforeEach((t) => {
  handleProductQuery = async () => ({ rows: [], rowCount: 0 });
  t.mock.method(pool, 'query', async (query, ...args) => {
    if (typeof query === 'string' && query.includes('FROM revoked_tokens')) {
      return { rows: [], rowCount: 0 };
    }
    return handleProductQuery(query, ...args);
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
    id: productId,
    email: `${role}@example.com`,
    role,
  });

const request = (path = '', { method = 'GET', role = 'owner', body, token = true } = {}) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${tokenFor(role)}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return fetch(`${baseUrl}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
};

describe('product endpoints', () => {
  it('lists products with the existing response envelope and pagination', async () => {
    handleProductQuery = async (query) => {
      if (query.includes('COUNT(*) AS total')) return { rows: [{ total: '1' }] };
      return { rows: [product] };
    };

    const response = await request();
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, 'success');
    assert.deepEqual(body.data, [product]);
    assert.deepEqual(body.pagination, { page: 1, limit: 20, total: 1, totalPages: 1 });
  });

  it('gets a product by UUID and returns 404 for an unknown UUID', async () => {
    handleProductQuery = async () => ({ rows: [product] });
    const found = await request(`/${productId}`);
    assert.equal(found.status, 200);
    assert.deepEqual((await found.json()).data, product);

    handleProductQuery = async () => ({ rows: [] });
    const missing = await request(`/${productId}`);
    assert.equal(missing.status, 404);
    assert.equal((await missing.json()).status, 'error');
  });

  it('rejects malformed product UUIDs with 400', async () => {
    const response = await request('/not-a-uuid');
    assert.equal(response.status, 400);
  });

  it('creates a product and rejects missing, negative, or non-numeric required values', async () => {
    handleProductQuery = async () => ({ rows: [product] });
    const created = await request('', {
      method: 'POST',
      body: { name: 'Produk Uji', selling_price: 15000 },
    });
    assert.equal(created.status, 201);
    assert.deepEqual((await created.json()).data, product);

    const missing = await request('', { method: 'POST', body: { name: 'Produk Uji' } });
    assert.equal(missing.status, 400);
    const invalidPrice = await request('', {
      method: 'POST',
      body: { name: 'Produk Uji', selling_price: null },
    });
    assert.equal(invalidPrice.status, 400);
    assert.equal((await invalidPrice.json()).status, 'error');

    const negativePrice = await request('', {
      method: 'POST',
      body: { name: 'Produk Uji', selling_price: -1 },
    });
    assert.equal(negativePrice.status, 400);
  });

  it('updates a product and returns 404 when the UUID does not exist', async () => {
    handleProductQuery = async () => ({ rows: [product] });
    const updated = await request(`/${productId}`, {
      method: 'PUT',
      body: { selling_price: 16000 },
    });
    assert.equal(updated.status, 200);
    assert.deepEqual((await updated.json()).data, product);

    handleProductQuery = async () => ({ rows: [] });
    const missing = await request(`/${productId}`, {
      method: 'PUT',
      body: { name: 'Produk Uji' },
    });
    assert.equal(missing.status, 404);
  });

  it('rejects invalid update values and empty updates with 400', async () => {
    const invalidPrice = await request(`/${productId}`, {
      method: 'PUT',
      body: { selling_price: true },
    });
    assert.equal(invalidPrice.status, 400);

    const empty = await request(`/${productId}`, { method: 'PUT', body: {} });
    assert.equal(empty.status, 400);
  });

  it('deletes a product and returns 404 when the UUID does not exist', async () => {
    handleProductQuery = async () => ({ rows: [product] });
    const deleted = await request(`/${productId}`, { method: 'DELETE' });
    assert.equal(deleted.status, 200);
    assert.equal((await deleted.json()).status, 'success');

    handleProductQuery = async () => ({ rows: [] });
    const missing = await request(`/${productId}`, { method: 'DELETE' });
    assert.equal(missing.status, 404);
  });

  it('requires a JWT for all five product routes', async () => {
    const requests = [
      request('', { token: false }),
      request(`/${productId}`, { token: false }),
      request('', { method: 'POST', body: {}, token: false }),
      request(`/${productId}`, { method: 'PUT', body: {}, token: false }),
      request(`/${productId}`, { method: 'DELETE', token: false }),
    ];
    const responses = await Promise.all(requests);
    assert.deepEqual(
      responses.map((response) => response.status),
      [401, 401, 401, 401, 401],
    );
  });

  it('allows cashiers to read products and denies them all mutations', async () => {
    handleProductQuery = async (query) =>
      query.includes('COUNT(*) AS total') ? { rows: [{ total: '1' }] } : { rows: [product] };
    assert.equal((await request('', { role: 'cashier' })).status, 200);
    assert.equal((await request(`/${productId}`, { role: 'cashier' })).status, 200);

    const responses = await Promise.all([
      request('', { method: 'POST', role: 'cashier', body: { name: 'Produk Uji' } }),
      request(`/${productId}`, { method: 'PUT', role: 'cashier', body: { name: 'Produk Uji' } }),
      request(`/${productId}`, { method: 'DELETE', role: 'cashier' }),
    ]);
    assert.deepEqual(
      responses.map((response) => response.status),
      [403, 403, 403],
    );
  });
});
