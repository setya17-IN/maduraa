import express from 'express';
import { getMe, loginUser, logoutUser, registerUser } from '../controllers/authController.js';
import verifyToken from '../middlewares/verifyToken.js';
import { validateLogin, validateRegistration } from '../middlewares/validateRequest.js';

const router = express.Router();

router.post('/register', validateRegistration, registerUser);
router.post('/login', validateLogin, loginUser);
router.post('/logout', verifyToken, logoutUser);
router.get('/me', verifyToken, getMe);

export default router;
