import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  generateAuthToken,
  hashPassword,
  verifyAuthToken,
  verifyPassword,
} from '../src/utils/authSecurity.js';

const testSecret = 'unit-test-secret-that-is-at-least-32-characters-long';
const originalSecret = process.env.JWT_SECRET;
process.env.JWT_SECRET = testSecret;
after(() => {
  if (originalSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalSecret;
});

describe('password security', () => {
  it('hashes passwords so the stored value is not the original password', async () => {
    const password = 'Maduraa-test-password';
    const passwordHash = await hashPassword(password);

    assert.notEqual(passwordHash, password);
    assert.equal(await bcrypt.compare(password, passwordHash), true);
  });

  it('accepts the correct password and rejects an incorrect one', async () => {
    const passwordHash = await hashPassword('correct-password');

    assert.equal(await verifyPassword('correct-password', passwordHash), true);
    assert.equal(await verifyPassword('wrong-password', passwordHash), false);
  });
});

describe('authentication token', () => {
  it('signs a JWT with user claims and a 24 hour expiry', () => {
    const user = { id: 42, email: 'user@example.com', role: 'cashier', password: 'must-not-leak' };
    const token = generateAuthToken(user);
    const decoded = verifyAuthToken(token);

    assert.equal(decoded.id, user.id);
    assert.equal(decoded.email, user.email);
    assert.equal(decoded.role, user.role);
    assert.equal(decoded.exp - decoded.iat, 24 * 60 * 60);
    assert.equal(Object.hasOwn(decoded, 'password'), false);
  });

  it('rejects a token signed with a different secret', () => {
    const token = generateAuthToken({ id: 1, email: 'user@example.com', role: 'cashier' });
    process.env.JWT_SECRET = 'different-unit-test-secret-at-least-32-characters-long';

    try {
      assert.throws(() => verifyAuthToken(token), {
        message: 'Token tidak valid atau kedaluwarsa',
      });
    } finally {
      process.env.JWT_SECRET = testSecret;
    }
  });

  it('rejects a malformed token', () => {
    assert.throws(() => verifyAuthToken('not.a.valid-jwt'), {
      message: 'Token tidak valid atau kedaluwarsa',
    });
  });

  it('rejects an expired token', () => {
    const token = jwt.sign(
      { id: 1, email: 'user@example.com', role: 'cashier' },
      testSecret,
      { algorithm: 'HS256', expiresIn: -1, jwtid: 'expired-unit-test-token' },
    );

    assert.throws(() => verifyAuthToken(token), {
      message: 'Token tidak valid atau kedaluwarsa',
    });
  });
});
