import { verifyAuthToken } from '../utils/authSecurity.js';
import pool from '../config/db.js';

const verifyToken = async (req, res, next) => {
  const [scheme, token, ...extra] = (req.headers.authorization || '').trim().split(/\s+/);

  if (scheme?.toLowerCase() !== 'bearer' || !token || extra.length > 0) {
    return res.status(401).json({ status: 'error', message: 'Token akses wajib dikirim' });
  }

  let decoded;
  try {
    decoded = verifyAuthToken(token);
  } catch {
    return res.status(401).json({ status: 'error', message: 'Token tidak valid atau kedaluwarsa' });
  }

  try {
    const revoked = await pool.query(
      'SELECT 1 FROM revoked_tokens WHERE jti = $1 AND expires_at > NOW()',
      [decoded.jti],
    );
    if (revoked.rowCount > 0) {
      return res.status(401).json({ status: 'error', message: 'Token sudah dicabut. Silakan login kembali.' });
    }
    req.user = decoded;
    return next();
  } catch {
    return res.status(500).json({ status: 'error', message: 'Verifikasi token gagal' });
  }
};

export default verifyToken;
