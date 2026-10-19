import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Validasi input kosong
        if (!name || !email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Nama, email, dan password wajib diisi!'
            });
        }

        // Cek apakah email sudah terdaftar di tabel profiles
        const userCheck = await pool.query('SELECT * FROM profiles WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Email sudah terdaftar!'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Simpan user baru ke tabel profiles Supabase
        const newUser = await pool.query(
            'INSERT INTO profiles (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name, email, hashedPassword, role || 'user']
        );

        res.status(201).json({
            status: 'success',
            message: 'Registrasi berhasil! Silakan login.',
            data: newUser.rows[0]
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validasi input login kosong
        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Email dan password wajib diisi!'
            });
        }

        // Cek ketersediaan user di tabel profiles
        const userResult = await pool.query('SELECT * FROM profiles WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({
                status: 'error',
                message: 'Email atau password salah!'
            });
        }

        const user = userResult.rows[0];

        // Verifikasi password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                status: 'error',
                message: 'Email atau password salah!'
            });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            status: 'success',
            message: 'Login berhasil',
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};