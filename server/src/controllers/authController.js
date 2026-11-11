import pool from '../config/db.js';
import { errorResponse } from '../utils/responseHelper.js';
import { generateAuthToken, verifyPassword } from '../utils/authSecurity.js';

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!normalizedEmail || typeof password !== 'string' || !password) {
      return res.status(400).json({ status: 'error', message: 'Email dan password wajib diisi!' });
    }

    const userQuery = await pool.query('SELECT * FROM profiles WHERE LOWER(email) = $1', [
      normalizedEmail,
    ]);
    if (userQuery.rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Email atau password salah' });
    }

    const user = userQuery.rows[0];
    if (!(await verifyPassword(password, user.password))) {
      return res.status(401).json({ status: 'error', message: 'Email atau password salah' });
    }

    const token = generateAuthToken(user);

    return res.status(200).json({
      status: 'success',
      message: 'Login berhasil',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const getMe = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Profil pengguna berhasil diambil',
    user: req.user,
  });
};

export const logoutUser = async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO revoked_tokens (jti, expires_at) VALUES ($1, to_timestamp($2)) ON CONFLICT (jti) DO NOTHING',
      [req.user.jti, req.user.exp],
    );
    await pool.query('DELETE FROM revoked_tokens WHERE expires_at <= NOW()');
    return res.status(200).json({ status: 'success', message: 'Logout berhasil' });
  } catch {
    return res.status(500).json({ status: 'error', message: 'Logout gagal diproses' });
  }
};
