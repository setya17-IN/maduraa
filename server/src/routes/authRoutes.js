import express from 'express';
import { getMe, loginUser, logoutUser, registerUser } from '../controllers/authController.js';
import loginRateLimit from '../middlewares/loginRateLimit.js';
import verifyToken from '../middlewares/verifyToken.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginRateLimit, loginUser);
router.post('/logout', verifyToken, logoutUser);

router.get('/me', verifyToken, getMe);

export default router;
