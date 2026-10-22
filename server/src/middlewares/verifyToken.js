import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak, token tidak ditemukan!' });
  }

  jwt.verify(token, env.jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token tidak valid atau kedaluwarsa!' });
    }
    req.user = decoded;
    next();
  });
};

export default verifyToken;
