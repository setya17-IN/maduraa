import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';

process.env.DATABASE_URL ??= 'postgresql://test:test@127.0.0.1:5432/test';
process.env.JWT_SECRET ??= 'product-search-test-secret-at-least-32-characters';

const [{ default: app }, { default: pool }, { generateAuthToken }] = await Promise.all([
  import('../src/app.js'),
  import('../src/config/db.js'),
  import('../src/utils/authSecurity.js'),
]);

const userId = 'a3bb189e-8bf9-3888-9912-ace4e6543002';
const categoryId = 'b3bb189e-8bf9-3888-9912-ace4e6543003';
const products = [
  { id: 'c3bb189e-8bf9-3888-9912-ace4e6543004', name: 'Kopi Arabika', category_id: categoryId },
  { id: 'd3bb189e-8bf9-3888-9912-ace4e6543005', name: 'Teh Kopi', category_id: categoryId },
  { id: 'e3bb189e-8bf9-3888-9912-ace4e6543006', name: 'Kopi Susu', category_id: userId },
];

let server;
let baseUrl;
let handleProductQuery;
let calls;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api/v1/products`;
});

beforeEach((t) => {
  calls = [];
  handleProductQuery = async () => ({ rows: [], rowCount: 0 });
  t.mock.method(pool, 'query', async (query, params = []) => {
    if (typeof query === 'string' && query.includes('FROM revoked_tokens')) {
      return { rows: [], rowCount: 0 };
    }
    calls.push({ query, params });
    return handleProductQuery(query, params);
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

const token = generateAuthToken({ id: userId, email: 'owner@example.com', role: 'owner' });
const request = (query = '') =>
  fetch(`${baseUrl}${query}`, { headers: { Authorization: `Bearer ${token}` } });
const isCountQuery = ({ query }) => query.includes('COUNT(*) AS total');

describe('product search, filtering, and pagination', () => {
  it('searches case-insensitively and matches a partial product name', async () => {
    handleProductQuery = async (query, params) => {
      if (query.includes('COUNT(*) AS total')) return { rows: [{ total: '3' }] };
      const term = params.find((value) => typeof value === 'string' && value.startsWith('%'));
      const keyword = term.slice(1, -1).toLocaleLowerCase();
      return { rows: products.filter(({ name }) => name.toLocaleLowerCase().includes(keyword)) };
    };

    const response = await request('?search=KoPi');
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body.data.map(({ name }) => name), ['Kopi Arabika', 'Teh Kopi', 'Kopi Susu']);
    const searchCall = calls.find((call) => !isCountQuery(call));
    assert.ok(searchCall.params.includes('%KoPi%'));
    assert.ok(!searchCall.query.includes('KoPi'));
  });

  it('returns an empty data array when the search keyword is not found', async () => {
    handleProductQuery = async (query) =>
      query.includes('COUNT(*) AS total')
        ? { rows: [{ total: '0' }] }
        : { rows: [] };

    const response = await request('?search=tidak-ada');
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body.data, []);
    assert.equal(calls.find((call) => !isCountQuery(call)).params[0], '%tidak-ada%');
  });

  it('filters products by category_id', async () => {
    handleProductQuery = async (query, params) =>
      query.includes('COUNT(*) AS total')
        ? { rows: [{ total: '2' }] }
        : { rows: products.filter(({ category_id }) => category_id === params[0]) };

    const response = await request(`?category_id=${categoryId}`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body.data.map(({ name }) => name), ['Kopi Arabika', 'Teh Kopi']);
    assert.ok(calls.every(({ params }) => params[0] === categoryId));
  });

  it('combines search and category_id filters', async () => {
    handleProductQuery = async (query, params) => {
      if (query.includes('COUNT(*) AS total')) return { rows: [{ total: '2' }] };
      return {
        rows: products.filter(
          ({ name, category_id }) =>
            name.toLowerCase().includes(params[0].slice(1, -1).toLowerCase()) &&
            category_id === params[1],
        ),
      };
    };

    const response = await request(`?search=kopi&category_id=${categoryId}`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body.data.map(({ name }) => name), ['Kopi Arabika', 'Teh Kopi']);
    assert.deepEqual(calls[0].params.slice(0, 2), ['%kopi%', categoryId]);
  });

  it('uses page=1 and limit=20 by default', async () => {
    handleProductQuery = async (query) =>
      query.includes('COUNT(*) AS total')
        ? { rows: [{ total: '1' }] }
        : { rows: [products[0]] };

    const response = await request();
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body.pagination, { page: 1, limit: 20, total: 1, totalPages: 1 });
    assert.deepEqual(calls.find((call) => !isCountQuery(call)).params, [20, 0]);
  });

  it('accepts the maximum limit of 100', async () => {
    handleProductQuery = async (query) =>
      query.includes('COUNT(*) AS total')
        ? { rows: [{ total: '0' }] }
        : { rows: [] };

    const response = await request('?limit=100');
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.pagination.limit, 100);
    assert.deepEqual(calls.find((call) => !isCountQuery(call)).params, [100, 0]);
  });

  it('rejects zero, negative, and non-numeric page and limit values', async () => {
    for (const [key, value] of [
      ['page', '0'], ['page', '-1'], ['page', 'abc'],
      ['limit', '0'], ['limit', '-1'], ['limit', 'abc'],
    ]) {
      const response = await request(`?${key}=${encodeURIComponent(value)}`);
      assert.equal(response.status, 400, `${key}=${value}`);
      assert.deepEqual(await response.json(), {
        status: 'error',
        message: `${key} harus berupa bilangan positif`,
      });
    }

    const tooLarge = await request('?limit=101');
    assert.equal(tooLarge.status, 400);
    assert.deepEqual(await tooLarge.json(), { status: 'error', message: 'limit maksimal 100' });
    assert.equal(calls.length, 0);
  });

  it('calculates the offset correctly for pages after the first', async () => {
    handleProductQuery = async (query) =>
      query.includes('COUNT(*) AS total')
        ? { rows: [{ total: '45' }] }
        : { rows: [products[0]] };

    const response = await request('?page=3&limit=10');
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(calls.find((call) => !isCountQuery(call)).params, [10, 20]);
    assert.deepEqual(body.pagination, { page: 3, limit: 10, total: 45, totalPages: 5 });
  });

  it('returns accurate pagination metadata when total is zero', async () => {
    handleProductQuery = async (query) =>
      query.includes('COUNT(*) AS total')
        ? { rows: [{ total: '0' }] }
        : { rows: [] };

    const response = await request('?page=2&limit=10');
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body.pagination, { page: 2, limit: 10, total: 0, totalPages: 0 });
    assert.deepEqual(body.data, []);
  });
});
