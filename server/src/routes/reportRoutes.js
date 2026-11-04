import express from 'express';
import { getSalesReport } from '../controllers/reportController.js';
import verifyToken from '../middlewares/verifyToken.js';
import { authorizeRoles } from '../middlewares/validateRequest.js';

const router = express.Router();

router.get('/sales', verifyToken, authorizeRoles('admin'), getSalesReport);

export default router;
