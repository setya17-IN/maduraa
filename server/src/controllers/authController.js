import pool from '../config/db.js';
import { errorResponse } from '../utils/responseHelper.js';
import { generateAuthToken, hashPassword, verifyPassword } from '../utils/authSecurity.js';

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (![name, normalizedEmail, password].every((value) => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ status: 'error', message: 'Nama, email, dan password wajib diisi!' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ status: 'error', message: 'Format email tidak valid!' });
    }

    const userCheck = await pool.query('SELECT id FROM profiles WHERE LOWER(email) = $1', [normalizedEmail]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ status: 'error', message: 'Email sudah terdaftar' });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = await pool.query(
      'INSERT INTO profiles (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name.trim(), normalizedEmail, hashedPassword, 'user'],
    );

    return res.status(201).json({
      status: 'success',
      message: 'Registrasi berhasil! Silakan login.',
      data: newUser.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ status: 'error', message: 'Email sudah terdaftar' });
    }
    return errorResponse(res, error.message);
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!normalizedEmail || typeof password !== 'string' || !password) {
      return res.status(400).json({ status: 'error', message: 'Email dan password wajib diisi!' });
    }

    const userQuery = await pool.query('SELECT * FROM profiles WHERE LOWER(email) = $1', [normalizedEmail]);
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
