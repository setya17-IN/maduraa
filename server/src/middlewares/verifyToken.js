import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import pool from '../config/db.js';

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const [scheme, token, ...extra] = authHeader?.trim().split(/\s+/) ?? [];

  if (scheme?.toLowerCase() !== 'bearer' || !token || extra.length > 0) {
    return res.status(401).json({ status: 'error', message: 'Akses ditolak, token tidak ditemukan!' });
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
    if (!decoded.jti || !decoded.exp) {
      return res.status(401).json({ status: 'error', message: 'Token tidak valid atau kedaluwarsa!' });
    }

    const revoked = await pool.query(
      'SELECT 1 FROM revoked_tokens WHERE jti = $1 AND expires_at > NOW()',
      [decoded.jti],
    );
    if (revoked.rowCount > 0) {
      return res.status(401).json({ status: 'error', message: 'Token sudah dicabut. Silakan login kembali.' });
    }

    req.user = decoded;
    return next();
  } catch (error) {
    if (['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name)) {
      return res.status(401).json({ status: 'error', message: 'Token tidak valid atau kedaluwarsa!' });
    }
    return res.status(500).json({ status: 'error', message: 'Verifikasi token gagal.' });
  }
};

export default verifyToken;
