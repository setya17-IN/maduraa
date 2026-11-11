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
router.post('/', verifyToken, authorizeRoles('owner'), validateCategory, createCategory);
router.put(
  '/:id',
  verifyToken,
  authorizeRoles('owner'),
  validateIdParam,
  validateCategory,
  updateCategory,
);
router.delete('/:id', verifyToken, authorizeRoles('owner'), validateIdParam, deleteCategory);

export default router;
