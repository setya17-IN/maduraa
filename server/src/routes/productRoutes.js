import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import verifyToken from '../middlewares/verifyToken.js';
import { authorizeRoles, validateRequired, validateIdParam } from '../middlewares/validateRequest.js';

const router = express.Router();

router.get('/', verifyToken, getProducts);
router.get('/:id', verifyToken, validateIdParam, getProductById);
router.post('/', verifyToken, authorizeRoles('admin'), validateRequired(['name', 'selling_price']), createProduct);
router.put('/:id', verifyToken, authorizeRoles('admin'), validateIdParam, updateProduct);
router.delete('/:id', verifyToken, authorizeRoles('admin'), validateIdParam, deleteProduct);

export default router;
