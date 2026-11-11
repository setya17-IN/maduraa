import express from 'express';
import { getMe, loginUser, logoutUser } from '../controllers/authController.js';
import loginRateLimit from '../middlewares/loginRateLimit.js';
import verifyToken from '../middlewares/verifyToken.js';
import { validateLogin } from '../middlewares/validateRequest.js';

const router = express.Router();

router.post('/login', loginRateLimit, validateLogin, loginUser);
router.post('/logout', verifyToken, logoutUser);
router.get('/me', verifyToken, getMe);

export default router;
