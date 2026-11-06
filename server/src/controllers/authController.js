import pool from '../config/db.js';
import { errorResponse } from '../utils/responseHelper.js';
import { generateAuthToken, hashPassword, verifyPassword } from '../utils/authSecurity.js';

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Cek apakah email sudah terdaftar di tabel profiles
    const userCheck = await pool.query('SELECT id FROM profiles WHERE LOWER(email) = $1', [
      normalizedEmail,
    ]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ status: 'error', message: 'Email sudah terdaftar' });
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
    if (error.code === '23505')
      return res.status(409).json({ status: 'error', message: 'Email sudah terdaftar' });
    return errorResponse(res, error.message);
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Cek ketersediaan user di tabel profiles
    const userQuery = await pool.query('SELECT * FROM profiles WHERE LOWER(email) = $1', [
      email.trim().toLowerCase(),
    ]);
    if (userQuery.rows.length === 0) {
      return res.status(401).json({ status: 'error', message: 'Email atau password salah' });
    }

    const user = userQuery.rows[0];

    // Verifikasi password
    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Email atau password salah' });
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

export const getMe = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Profil pengguna berhasil diambil',
    user: req.user,
  });
};
