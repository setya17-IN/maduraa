import express from 'express';
import { getMe, loginUser, registerUser } from '../controllers/authController.js';
import verifyToken from '../middlewares/verifyToken.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/me', verifyToken, getMe);

export default router;
