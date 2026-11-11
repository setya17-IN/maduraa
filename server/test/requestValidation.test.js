import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  authorizeRoles,
  validateCategory,
  validateLogin,
  validatePagination,
  validateProduct,
  validateReportQuery,
  validateTransaction,
} from '../src/middlewares/validateRequest.js';

const run = (middleware, req) => {
  const result = { statusCode: 200, body: undefined, passed: false };
  const res = {
    status(code) {
      result.statusCode = code;
      return this;
    },
    json(body) {
      result.body = body;
      return this;
    },
  };
  middleware(req, res, () => {
    result.passed = true;
  });
  return result;
};

describe('request validation', () => {
  it('rejects malformed login and out of range pagination', () => {
    assert.equal(run(validateLogin, { body: { email: '', password: 'x' } }).statusCode, 400);
    assert.equal(run(validatePagination, { query: { limit: '101' } }).statusCode, 400);
    assert.equal(run(validatePagination, { query: { page: '2', limit: '50' } }).passed, true);
  });

  it('rejects invalid product values and transaction items', () => {
    assert.equal(run(validateProduct, { body: { selling_price: -1 } }).statusCode, 400);
    assert.equal(run(validateProduct, { body: { stock: 2 } }).passed, true);
    assert.equal(
      run(validateTransaction, { body: { items: [{ product_id: '1', quantity: 1 }] } }).statusCode,
      400,
    );
  });

  it('rejects empty and oversized category names', () => {
    assert.equal(run(validateCategory, { body: { name: '  ' } }).statusCode, 400);
    assert.equal(run(validateCategory, { body: { name: 'Drink' } }).passed, true);
  });

  it('enforces role checks and report date ranges', () => {
    assert.equal(run(authorizeRoles('owner'), { user: { role: 'cashier' } }).statusCode, 403);
    assert.equal(run(authorizeRoles('owner'), { user: { role: 'owner' } }).passed, true);
    assert.equal(run(authorizeRoles('owner'), {}).statusCode, 403);
    assert.equal(
      run(validateReportQuery, { query: { start_date: '2026-02-30', end_date: '2026-03-01' } })
        .statusCode,
      400,
    );
    assert.equal(run(validateReportQuery, { query: { type: 'weekly' } }).passed, true);
  });
});
