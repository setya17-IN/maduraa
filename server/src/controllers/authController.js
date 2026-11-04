import pool from '../config/db.js';
import { errorResponse } from '../utils/responseHelper.js';
import { generateAuthToken, hashPassword, verifyPassword } from '../utils/authSecurity.js';

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      return res.status(400).json({ status: 'error', message: 'Nama harus berisi 2-100 karakter' });
    }
    if (
      typeof email !== 'string' ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({ status: 'error', message: 'Format email tidak valid' });
    }
    if (
      typeof password !== 'string' ||
      password.length < 8 ||
      Buffer.byteLength(password, 'utf8') > 72
    ) {
      return res.status(400).json({ status: 'error', message: 'Password harus 8 karakter atau lebih' });
    }

    // Cek apakah email sudah terdaftar di tabel profiles
    const normalizedEmail = email.trim().toLowerCase();
    const userCheck = await pool.query('SELECT id FROM profiles WHERE LOWER(email) = $1', [
      normalizedEmail,
    ]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'Email sudah terdaftar!',
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Simpan user baru ke tabel profiles Supabase
    const newUser = await pool.query(
      'INSERT INTO profiles (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name.trim(), normalizedEmail, hashedPassword, 'user'],
    );

    res.status(201).json({
      status: 'success',
      message: 'Registrasi berhasil! Silakan login.',
      data: newUser.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ status: 'error', message: 'Email sudah terdaftar!' });
    }
    return errorResponse(res, error.message);
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    // Validasi input login kosong
    if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email dan password wajib diisi!',
      });
    }

    // Cek ketersediaan user di tabel profiles
    const userQuery = await pool.query('SELECT * FROM profiles WHERE LOWER(email) = $1', [
      email.trim().toLowerCase(),
    ]);
    if (userQuery.rows.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Email atau password salah!',
      });
    }

    const user = userQuery.rows[0];

    // Verifikasi password
    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Email atau password salah!',
      });
    }

    // Generate JWT Token
    const token = generateAuthToken(user);

    res.status(200).json({
      status: 'success',
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

export const logoutUser = async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO revoked_tokens (jti, expires_at) VALUES ($1, to_timestamp($2)) ON CONFLICT (jti) DO NOTHING',
      [req.user.jti, req.user.exp],
    );
    await pool.query('DELETE FROM revoked_tokens WHERE expires_at <= NOW()');
    return res.status(200).json({ status: 'success', message: 'Logout berhasil' });
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
