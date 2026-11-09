import express from 'express';
import { getSalesReport } from '../controllers/reportController.js';
import verifyToken from '../middlewares/verifyToken.js';
import { authorizeRoles, validateReportQuery } from '../middlewares/validateRequest.js';

const router = express.Router();

router.get('/sales', verifyToken, authorizeRoles('admin'), validateReportQuery, getSalesReport);

export default router;
