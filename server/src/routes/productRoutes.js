import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} from '../controllers/productController.js';
import verifyToken from '../middlewares/verifyToken.js';
import productImageUpload from '../middlewares/productImageUpload.js';
import {
  authorizeRoles,
  validatePagination,
  validateProduct,
  validateRequired,
  validateIdParam,
} from '../middlewares/validateRequest.js';

const router = express.Router();

router.get('/', verifyToken, validatePagination, getProducts);
router.get('/:id', verifyToken, validateIdParam, getProductById);
router.post(
  '/',
  verifyToken,
  authorizeRoles('owner'),
  validateRequired(['name', 'selling_price']),
  validateProduct,
  createProduct,
);
router.put(
  '/:id',
  verifyToken,
  authorizeRoles('owner'),
  validateIdParam,
  validateProduct,
  updateProduct,
);
router.delete('/:id', verifyToken, authorizeRoles('owner'), validateIdParam, deleteProduct);
router.post(
  '/:id/image',
  verifyToken,
  authorizeRoles('owner'),
  validateIdParam,
  productImageUpload,
  uploadProductImage,
);

export default router;
