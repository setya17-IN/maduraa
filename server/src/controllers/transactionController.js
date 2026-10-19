import pool from '../config/db.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

/**
 * POST /api/v1/transactions
 * Buat transaksi baru + kurangi stok otomatis
 *
 * Body:
 * {
 *   items: [
 *     { product_id: 1, quantity: 2 },
 *     { product_id: 3, quantity: 1 }
 *   ]
 * }
 */
export const createTransaction = async (req, res) => {
    const client = await pool.connect();
    try {
        const { items } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return errorResponse(res, 'Items transaksi wajib diisi dan tidak boleh kosong', 400);
        }

        await client.query('BEGIN');

        let grandTotal = 0;
        const transactionItems = [];

        // Proses setiap item
        for (const item of items) {
            const { product_id, quantity } = item;

            if (!product_id || !quantity || quantity <= 0) {
                await client.query('ROLLBACK');
                return errorResponse(res, 'Setiap item harus memiliki product_id dan quantity > 0', 400);
            }

            // Ambil data produk
            const productResult = await client.query(
                'SELECT id, name, selling_price, stock FROM products WHERE id = $1',
                [product_id]
            );

            if (productResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return errorResponse(res, `Produk dengan ID ${product_id} tidak ditemukan`, 404);
            }

            const product = productResult.rows[0];

            // Cek stok cukup
            if (parseFloat(product.stock) < quantity) {
                await client.query('ROLLBACK');
                return errorResponse(
                    res,
                    `Stok "${product.name}" tidak cukup. Tersisa: ${product.stock}`,
                    400
                );
            }

            const unitPrice = parseFloat(product.selling_price);
            const subtotal = unitPrice * quantity;
            grandTotal += subtotal;

            transactionItems.push({
                product_id,
                quantity,
                unit_price: unitPrice,
                subtotal,
            });

            // Kurangi stok
            await client.query(
                'UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2',
                [quantity, product_id]
            );
        }

        // Simpan transaksi header
        const transactionResult = await client.query(
            'INSERT INTO transactions (total) VALUES ($1) RETURNING *',
            [grandTotal]
        );
        const transactionId = transactionResult.rows[0].id;

        // Simpan transaction items
        for (const ti of transactionItems) {
            await client.query(
                `INSERT INTO transaction_items (transaction_id, product_id, quantity, unit_price, subtotal)
                 VALUES ($1, $2, $3, $4, $5)`,
                [transactionId, ti.product_id, ti.quantity, ti.unit_price, ti.subtotal]
            );
        }

        await client.query('COMMIT');

        return successResponse(
            res,
            'Transaksi berhasil disimpan',
            {
                transaction: transactionResult.rows[0],
                items: transactionItems,
            },
            201
        );
    } catch (error) {
        await client.query('ROLLBACK');
        return errorResponse(res, error.message);
    } finally {
        client.release();
    }
};

/**
 * GET /api/v1/transactions
 * Daftar transaksi dengan detail items
 */
export const getTransactions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        // Count total
        const countResult = await pool.query('SELECT COUNT(*) AS total FROM transactions');
        const total = parseInt(countResult.rows[0].total);

        // Fetch transactions
        const transactions = await pool.query(
            'SELECT * FROM transactions ORDER BY created_at DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        // Fetch items untuk setiap transaksi
        const transactionsWithItems = await Promise.all(
            transactions.rows.map(async (trx) => {
                const items = await pool.query(
                    `SELECT ti.*, p.name AS product_name
                     FROM transaction_items ti
                     JOIN products p ON ti.product_id = p.id
                     WHERE ti.transaction_id = $1`,
                    [trx.id]
                );
                return { ...trx, items: items.rows };
            })
        );

        return successResponse(res, 'Daftar transaksi berhasil diambil', {
            transactions: transactionsWithItems,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        return errorResponse(res, error.message);
    }
};

/**
 * GET /api/v1/transactions/:id
 * Detail satu transaksi
 */
export const getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;

        const transaction = await pool.query(
            'SELECT * FROM transactions WHERE id = $1',
            [id]
        );
        if (transaction.rows.length === 0) {
            return errorResponse(res, 'Transaksi tidak ditemukan', 404);
        }

        const items = await pool.query(
            `SELECT ti.*, p.name AS product_name, p.unit
             FROM transaction_items ti
             JOIN products p ON ti.product_id = p.id
             WHERE ti.transaction_id = $1`,
            [id]
        );

        return successResponse(res, 'Detail transaksi berhasil diambil', {
            ...transaction.rows[0],
            items: items.rows,
        });
    } catch (error) {
        return errorResponse(res, error.message);
    }
};
