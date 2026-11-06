import express from 'express';
import {
  createTransaction,
  getTransactions,
  getTransactionById,
} from '../controllers/transactionController.js';
import verifyToken from '../middlewares/verifyToken.js';
import {
  validateIdParam,
  validatePagination,
  validateTransaction,
} from '../middlewares/validateRequest.js';

const router = express.Router();

router.post('/', verifyToken, validateTransaction, createTransaction);
router.get('/', verifyToken, validatePagination, getTransactions);
router.get('/:id', verifyToken, validateIdParam, getTransactionById);

export default router;
