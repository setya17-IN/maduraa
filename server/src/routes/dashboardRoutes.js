import express from 'express';
import { getDashboardSummary } from '../controllers/dashboardController.js';
import verifyToken from '../middlewares/verifyToken.js';

const router = express.Router();

router.get('/summary', verifyToken, getDashboardSummary);

export default router;
