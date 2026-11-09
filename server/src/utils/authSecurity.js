import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
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
    jwtid: crypto.randomUUID(),
  });

export const verifyAuthToken = (token) => {
  const secret = getJwtSecret();
  try {
    return jwt.verify(token, secret, { algorithms: ['HS256'] });
  } catch {
    throw new Error('Token tidak valid atau kedaluwarsa');
  }
};
