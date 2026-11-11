import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';

process.env.DATABASE_URL ??= 'postgresql://test:test@127.0.0.1:5432/test';
process.env.JWT_SECRET ??= 'transaction-read-test-secret-at-least-32-characters';

const [{ default: app }, { default: pool }, { generateAuthToken }] = await Promise.all([
  import('../src/app.js'),
  import('../src/config/db.js'),
  import('../src/utils/authSecurity.js'),
]);

const cashierId = 'a3bb189e-8bf9-3888-9912-ace4e6543002';
const otherUserId = 'b3bb189e-8bf9-3888-9912-ace4e6543003';
const transactionId = 'c3bb189e-8bf9-3888-9912-ace4e6543004';
const token = generateAuthToken({ id: cashierId, email: 'cashier@example.com', role: 'cashier' });
const transaction = {
  id: transactionId,
  user_id: otherUserId,
  total_amount: '25.00',
  created_at: '2026-11-11T00:00:00.000Z',
};

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
    if (query.includes('FROM revoked_tokens')) return { rowCount: 0, rows: [] };
    if (query.startsWith('SELECT COUNT(*) AS total FROM transactions')) {
      return { rows: [{ total: '2' }] };
    }
    if (query.startsWith('SELECT * FROM transactions ORDER BY')) {
      return { rows: [transaction] };
    }
    if (query === 'SELECT * FROM transactions WHERE id = $1') {
      return { rows: [transaction] };
    }
    if (query.includes('FROM transaction_items ti')) {
      return { rows: [{ id: 'item-1', product_name: 'Produk lain' }] };
    }
    throw new Error(`Unexpected transaction read query: ${query}`);
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

describe('transaction reads', () => {
  it('allows a cashier to list transactions created by other users with pagination', async () => {
    const response = await fetch(`${baseUrl}/transactions?page=2&limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.data.transactions[0].user_id, otherUserId);
    assert.deepEqual(body.data.pagination, { page: 2, limit: 1, total: 2, totalPages: 2 });
  });

  it('allows a cashier to read a transaction created by another user', async () => {
    const response = await fetch(`${baseUrl}/transactions/${transactionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.data.user_id, otherUserId);
    assert.equal(body.data.items[0].product_name, 'Produk lain');
  });
});
