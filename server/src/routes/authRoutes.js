import express from 'express';
import { loginUser, registerUser } from '../controllers/authController.js';
import verifyToken from '../middlewares/verifyToken.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/profile', verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Akses diizinkan ke rute terproteksi',
    user: req.user
  });
});

export default router;
