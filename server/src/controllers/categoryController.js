import pool from '../config/db.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

// GET /api/v1/categories — Daftar semua kategori
export const getCategories = async (_req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM categories ORDER BY name ASC'
        );
        return successResponse(res, 'Daftar kategori berhasil diambil', result.rows);
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

// POST /api/v1/categories — Tambah kategori baru
export const createCategory = async (req, res) => {
    try {
        const { name } = req.body;

        // Cek duplikat nama
        const existing = await pool.query(
            'SELECT id FROM categories WHERE LOWER(name) = LOWER($1)',
            [name]
        );
        if (existing.rows.length > 0) {
            return errorResponse(res, 'Kategori dengan nama tersebut sudah ada', 409);
        }

        const result = await pool.query(
            'INSERT INTO categories (name) VALUES ($1) RETURNING *',
            [name]
        );
        return successResponse(res, 'Kategori berhasil ditambahkan', result.rows[0], 201);
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

// PUT /api/v1/categories/:id — Update kategori
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        // Cek apakah kategori ada
        const categoryCheck = await pool.query('SELECT id FROM categories WHERE id = $1', [id]);
        if (categoryCheck.rows.length === 0) {
            return errorResponse(res, 'Kategori tidak ditemukan', 404);
        }

        // Cek duplikat nama (kecuali diri sendiri)
        const existing = await pool.query(
            'SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND id != $2',
            [name, id]
        );
        if (existing.rows.length > 0) {
            return errorResponse(res, 'Kategori dengan nama tersebut sudah ada', 409);
        }

        const result = await pool.query(
            'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
            [name, id]
        );
        return successResponse(res, 'Kategori berhasil diupdate', result.rows[0]);
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

// DELETE /api/v1/categories/:id — Hapus kategori
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM categories WHERE id = $1 RETURNING *',
            [id]
        );
        if (result.rows.length === 0) {
            return errorResponse(res, 'Kategori tidak ditemukan', 404);
        }

        return successResponse(res, 'Kategori berhasil dihapus');
    } catch (error) {
        return errorResponse(res, error.message);
    }
};
