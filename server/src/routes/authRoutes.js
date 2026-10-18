import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';
import verifyToken from '../middlewares/verifyToken.js'; // Import middleware verifikasi token

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

// Tambahkan rute profile yang diproteksi oleh verifyToken
// (Pastikan function controller profile-nya sudah di-import dari authController.js)
router.get('/profile', verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Akses diizinkan ke rute terproteksi',
    user: req.user
  });
});

export default router;