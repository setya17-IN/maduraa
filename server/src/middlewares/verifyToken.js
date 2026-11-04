import { verifyAuthToken } from '../utils/authSecurity.js';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak, token tidak ditemukan!' });
  }

  try {
    req.user = verifyAuthToken(token);
    return next();
  } catch {
    return res.status(403).json({ message: 'Token tidak valid atau kedaluwarsa!' });
  }
};

export default verifyToken;
