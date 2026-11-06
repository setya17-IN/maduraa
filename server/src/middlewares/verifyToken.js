import { verifyAuthToken } from '../utils/authSecurity.js';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const [scheme, token, ...extra] = (authHeader || '').split(' ');

  if (scheme !== 'Bearer' || !token || extra.length > 0) {
    return res.status(401).json({ status: 'error', message: 'Token akses wajib dikirim' });
  }

  try {
    req.user = verifyAuthToken(token);
    return next();
  } catch {
    return res.status(401).json({ status: 'error', message: 'Token tidak valid atau kedaluwarsa' });
  }
};

export default verifyToken;
