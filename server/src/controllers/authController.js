import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { env } from '../config/env.js';

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    // Validasi input kosong
    if (![name, normalizedEmail, password].every((value) => typeof value === 'string' && value.trim())) {
      return res.status(400).json({
        status: 'error',
        message: 'Nama, email, dan password wajib diisi!',
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ status: 'error', message: 'Format email tidak valid!' });
    }

    // Cek apakah email sudah terdaftar di tabel profiles
    const userCheck = await pool.query('SELECT id FROM profiles WHERE email = $1', [normalizedEmail]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Email sudah terdaftar!',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

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
    res.status(500).json({ status: 'error', message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    // Validasi input login kosong
    if (!normalizedEmail || typeof password !== 'string' || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email dan password wajib diisi!',
      });
    }

    // Cek ketersediaan user di tabel profiles
    const userQuery = await pool.query('SELECT * FROM profiles WHERE email = $1', [normalizedEmail]);
    if (userQuery.rows.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Email atau password salah!',
      });
    }

    const user = userQuery.rows[0];

    // Verifikasi password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Email atau password salah!',
      });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.jwtSecret,
      { expiresIn: '24h', jwtid: crypto.randomUUID() },
    );

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
    res.status(500).json({ status: 'error', message: error.message });
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
    res.status(200).json({ status: 'success', message: 'Logout berhasil' });
  } catch {
    res.status(500).json({ status: 'error', message: 'Logout gagal diproses' });
  }
};
