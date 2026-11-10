import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';

process.env.DATABASE_URL ??= 'postgresql://test:test@127.0.0.1:5432/test';
process.env.JWT_SECRET ??= 'checkout-test-secret-that-is-at-least-32-characters';

const [{ default: app }, { default: pool }, { generateAuthToken }] = await Promise.all([
  import('../src/app.js'),
  import('../src/config/db.js'),
  import('../src/utils/authSecurity.js'),
]);

const productId = 'a3bb189e-8bf9-3888-9912-ace4e6543002';
const userId = 'b3bb189e-8bf9-3888-9912-ace4e6543003';
const token = generateAuthToken({ id: userId, email: 'user@example.com', role: 'user' });

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
});

beforeEach((t) => {
  t.mock.method(pool, 'query', async (query) => {
    if (typeof query === 'string' && query.includes('FROM revoked_tokens')) {
      return { rowCount: 0, rows: [] };
    }
    throw new Error(`Unexpected pool query in checkout test: ${query}`);
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

const createFakeClient = (initialStock) => {
  const state = {
    stock: initialStock,
    transactionInserts: 0,
    itemInserts: 0,
    committed: false,
    rolledBack: false,
    released: false,
  };

  const client = {
    async query(query, values = []) {
      if (query === 'BEGIN') return { rows: [] };
      if (query === 'COMMIT') {
        state.committed = true;
        return { rows: [] };
      }
      if (query === 'ROLLBACK') {
        state.rolledBack = true;
        return { rows: [] };
      }
      if (query.includes('FOR UPDATE')) {
        return {
          rows: [{ id: productId, name: 'Produk Tes', selling_price: '12.50', stock: state.stock }],
        };
      }
      if (query.startsWith('UPDATE products SET stock = stock -')) {
        state.stock -= values[0];
        return { rows: [] };
      }
      if (query.startsWith('INSERT INTO transactions')) {
        state.transactionInserts += 1;
        return { rows: [{ id: 'c3bb189e-8bf9-3888-9912-ace4e6543004', total_amount: 25 }] };
      }
      if (query.includes('INSERT INTO transaction_items')) {
        state.itemInserts += 1;
        return { rows: [] };
      }
      throw new Error(`Unexpected checkout query: ${query}`);
    },
    release() {
      state.released = true;
    },
  };

  return { client, state };
};

const postCheckout = (items) =>
  fetch(`${baseUrl}/transactions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items }),
  });

describe('transaction checkout', () => {
  it('rejects insufficient stock and does not insert a transaction', async (t) => {
    const { client, state } = createFakeClient(1);
    t.mock.method(pool, 'connect', async () => client);

    const response = await postCheckout([{ product_id: productId, quantity: 2 }]);

    assert.equal(response.status, 400);
    assert.equal(state.transactionInserts, 0);
    assert.equal(state.itemInserts, 0);
    assert.equal(state.stock, 1);
    assert.equal(state.rolledBack, true);
    assert.equal(state.committed, false);
    assert.equal(state.released, true);
  });

  it('reduces stock by the requested quantity on successful checkout', async (t) => {
    const { client, state } = createFakeClient(8);
    t.mock.method(pool, 'connect', async () => client);

    const response = await postCheckout([{ product_id: productId, quantity: 5 }]);

    assert.equal(response.status, 201);
    assert.equal(state.stock, 3);
    assert.equal(state.transactionInserts, 1);
    assert.equal(state.itemInserts, 1);
    assert.equal(state.committed, true);
    assert.equal(state.rolledBack, false);
    assert.equal(state.released, true);
  });

  it('rejects quantity less than or equal to zero before opening a database transaction', async (t) => {
    let connectCalls = 0;
    t.mock.method(pool, 'connect', async () => {
      connectCalls += 1;
      throw new Error('A database transaction should not start for invalid quantity');
    });

    const response = await postCheckout([{ product_id: productId, quantity: 0 }]);

    assert.equal(response.status, 400);
    assert.equal(connectCalls, 0);
  });
});
