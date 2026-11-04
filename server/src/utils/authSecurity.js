import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (typeof secret !== 'string' || secret.length < 32) {
    throw new Error('JWT_SECRET must be set to a secret with at least 32 characters');
  }
  return secret;
};

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const verifyPassword = (password, passwordHash) => bcrypt.compare(password, passwordHash);

export const generateAuthToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, getJwtSecret(), {
    algorithm: 'HS256',
    expiresIn: '24h',
    jwtid: randomUUID(),
  });

export const verifyAuthToken = (token) => {
  const secret = getJwtSecret();
  try {
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
    if (
      typeof decoded !== 'object' ||
      typeof decoded.jti !== 'string' ||
      !Number.isInteger(decoded.exp)
    ) {
      throw new Error('Token tidak valid atau kedaluwarsa');
    }
    return decoded;
  } catch {
    throw new Error('Token tidak valid atau kedaluwarsa');
  }
};
