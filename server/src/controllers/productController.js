import pool from '../config/db.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseHelper.js';

// GET /api/v1/products — Daftar produk (dengan pagination & search)
export const getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const categoryId = req.query.category_id || null;

        let query = `
            SELECT p.*, c.name AS category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (search) {
            query += ` AND LOWER(p.name) LIKE LOWER($${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (categoryId) {
            query += ` AND p.category_id = $${paramIndex}`;
            params.push(categoryId);
            paramIndex++;
        }

        // Count total
        const countQuery = query.replace('SELECT p.*, c.name AS category_name', 'SELECT COUNT(*) AS total');
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total);

        // Fetch data dengan pagination
        query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        return paginatedResponse(res, 'Daftar produk berhasil diambil', result.rows, page, limit, total);
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

// GET /api/v1/products/:id — Detail produk
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT p.*, c.name AS category_name
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return errorResponse(res, 'Produk tidak ditemukan', 404);
        }

        return successResponse(res, 'Detail produk berhasil diambil', result.rows[0]);
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

// POST /api/v1/products — Tambah produk baru
export const createProduct = async (req, res) => {
    try {
        const { category_id, name, purchase_price, selling_price, stock, unit, photo_url } = req.body;

        const result = await pool.query(
            `INSERT INTO products (category_id, name, purchase_price, selling_price, stock, unit, photo_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [category_id || null, name, purchase_price || 0, selling_price || 0, stock || 0, unit || 'pcs', photo_url || null]
        );

        return successResponse(res, 'Produk berhasil ditambahkan', result.rows[0], 201);
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

// PUT /api/v1/products/:id — Update produk
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { category_id, name, purchase_price, selling_price, stock, unit, photo_url } = req.body;

        // Cek apakah produk ada
        const productCheck = await pool.query('SELECT id FROM products WHERE id = $1', [id]);
        if (productCheck.rows.length === 0) {
            return errorResponse(res, 'Produk tidak ditemukan', 404);
        }

        const result = await pool.query(
            `UPDATE products
             SET category_id = $1, name = $2, purchase_price = $3, selling_price = $4,
                 stock = $5, unit = $6, photo_url = $7, updated_at = NOW()
             WHERE id = $8 RETURNING *`,
            [category_id || null, name, purchase_price, selling_price, stock, unit || 'pcs', photo_url || null, id]
        );

        return successResponse(res, 'Produk berhasil diupdate', result.rows[0]);
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

// DELETE /api/v1/products/:id — Hapus produk
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM products WHERE id = $1 RETURNING *',
            [id]
        );
        if (result.rows.length === 0) {
            return errorResponse(res, 'Produk tidak ditemukan', 404);
        }

        return successResponse(res, 'Produk berhasil dihapus');
    } catch (error) {
        return errorResponse(res, error.message);
    }
};
