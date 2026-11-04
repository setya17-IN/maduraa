import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import verifyToken from '../middlewares/verifyToken.js';
import { authorizeRoles, validateRequired, validateIdParam } from '../middlewares/validateRequest.js';

const router = express.Router();

router.get('/', verifyToken, getCategories);
router.post('/', verifyToken, authorizeRoles('admin'), validateRequired(['name']), createCategory);
router.put('/:id', verifyToken, authorizeRoles('admin'), validateIdParam, validateRequired(['name']), updateCategory);
router.delete('/:id', verifyToken, authorizeRoles('admin'), validateIdParam, deleteCategory);

export default router;
