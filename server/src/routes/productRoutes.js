import express from 'express';
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
} from '../controllers/productController.js';
import verifyToken from '../middlewares/verifyToken.js';
import { validateRequired, validateIdParam } from '../middlewares/validateRequest.js';

const router = express.Router();

router.get('/', verifyToken, getProducts);
router.get('/:id', verifyToken, validateIdParam, getProductById);
router.post('/', verifyToken, validateRequired(['name', 'selling_price']), createProduct);
router.put('/:id', verifyToken, validateIdParam, validateRequired(['name', 'selling_price']), updateProduct);
router.delete('/:id', verifyToken, validateIdParam, deleteProduct);

export default router;
