import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import verifyToken from '../middlewares/verifyToken.js';
import {
  authorizeRoles,
  validateCategory,
  validateIdParam,
} from '../middlewares/validateRequest.js';

const router = express.Router();

router.get('/', verifyToken, getCategories);
router.post('/', verifyToken, authorizeRoles('admin'), validateCategory, createCategory);
router.put(
  '/:id',
  verifyToken,
  authorizeRoles('admin'),
  validateIdParam,
  validateCategory,
  updateCategory,
);
router.delete('/:id', verifyToken, authorizeRoles('admin'), validateIdParam, deleteCategory);

export default router;
