import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // (Opsional nanti) Simpan ke database PostgreSQL di sini

        res.status(201).json({
            status: 'success',
            message: 'Registrasi berhasil! Silakan login.'
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

        const token = jwt.sign(
            { email: email, role: 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            status: 'success',
            message: 'Login berhasil',
            token: token
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};