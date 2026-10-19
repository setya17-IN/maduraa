import express from 'express';
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
} from '../controllers/categoryController.js';
import verifyToken from '../middlewares/verifyToken.js';
import { validateRequired, validateIdParam } from '../middlewares/validateRequest.js';

const router = express.Router();

router.get('/', verifyToken, getCategories);
router.post('/', verifyToken, validateRequired(['name']), createCategory);
router.put('/:id', verifyToken, validateIdParam, validateRequired(['name']), updateCategory);
router.delete('/:id', verifyToken, validateIdParam, deleteCategory);

export default router;
