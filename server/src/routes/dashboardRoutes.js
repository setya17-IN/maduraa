import express from 'express';
import { getDashboardSummary } from '../controllers/dashboardController.js';
import verifyToken from '../middlewares/verifyToken.js';
import { authorizeRoles } from '../middlewares/validateRequest.js';

const router = express.Router();

router.get('/summary', verifyToken, authorizeRoles('admin'), getDashboardSummary);

export default router;
