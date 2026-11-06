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
  let client;
  let transactionStarted = false;
  try {
    const { items } = req.body;

    client = await pool.connect();
    await client.query('BEGIN');
    transactionStarted = true;

    let grandTotal = 0;
    const transactionItems = [];

    // Proses setiap item
    for (const item of items) {
      const { product_id, quantity } = item;

      // Ambil data produk
      const productResult = await client.query(
        'SELECT id, name, selling_price, stock FROM products WHERE id = $1 FOR UPDATE',
        [product_id],
      );

      if (productResult.rows.length === 0) {
        return errorResponse(res, `Produk dengan ID ${product_id} tidak ditemukan`, 404);
      }

      const product = productResult.rows[0];

      // Cek stok cukup
      if (parseFloat(product.stock) < quantity) {
        return errorResponse(
          res,
          `Stok "${product.name}" tidak cukup. Tersisa: ${product.stock}`,
          400,
        );
      }

      const unitPrice = parseFloat(product.selling_price);
      const subtotal = unitPrice * quantity;
      grandTotal += subtotal;

      transactionItems.push({
        product_id,
        quantity,
        price: unitPrice,
        subtotal,
      });

      // Kurangi stok
      await client.query(
        'UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2',
        [quantity, product_id],
      );
    }

    // Simpan transaksi header
    const transactionResult = await client.query(
      'INSERT INTO transactions (user_id, total_amount) VALUES ($1, $2) RETURNING *',
      [req.user.id, grandTotal],
    );
    const transactionId = transactionResult.rows[0].id;

    // Simpan transaction items
    for (const ti of transactionItems) {
      await client.query(
        `INSERT INTO transaction_items (transaction_id, product_id, quantity, price, subtotal)
                 VALUES ($1, $2, $3, $4, $5)`,
        [transactionId, ti.product_id, ti.quantity, ti.price, ti.subtotal],
      );
    }

    await client.query('COMMIT');
    transactionStarted = false;

    return successResponse(
      res,
      'Transaksi berhasil disimpan',
      {
        transaction: transactionResult.rows[0],
        items: transactionItems,
      },
      201,
    );
  } catch (error) {
    return errorResponse(res, error.message);
  } finally {
    if (client && transactionStarted) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Transaction rollback failed:', rollbackError);
      }
    }
    client?.release();
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

    const isAdmin = req.user.role === 'admin';
    const countResult = await pool.query(
      isAdmin
        ? 'SELECT COUNT(*) AS total FROM transactions'
        : 'SELECT COUNT(*) AS total FROM transactions WHERE user_id = $1',
      isAdmin ? [] : [req.user.id],
    );
    const total = parseInt(countResult.rows[0].total);

    // Fetch transactions
    const transactions = isAdmin
      ? await pool.query('SELECT * FROM transactions ORDER BY created_at DESC LIMIT $1 OFFSET $2', [
          limit,
          offset,
        ])
      : await pool.query(
          'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
          [req.user.id, limit, offset],
        );

    // Fetch items untuk setiap transaksi
    const transactionsWithItems = await Promise.all(
      transactions.rows.map(async (trx) => {
        const items = await pool.query(
          `SELECT ti.*, p.name AS product_name
                     FROM transaction_items ti
                     JOIN products p ON ti.product_id = p.id
                     WHERE ti.transaction_id = $1`,
          [trx.id],
        );
        return { ...trx, items: items.rows };
      }),
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

    const transaction =
      req.user.role === 'admin'
        ? await pool.query('SELECT * FROM transactions WHERE id = $1', [id])
        : await pool.query('SELECT * FROM transactions WHERE id = $1 AND user_id = $2', [
            id,
            req.user.id,
          ]);
    if (transaction.rows.length === 0) {
      return errorResponse(res, 'Transaksi tidak ditemukan', 404);
    }

    const items = await pool.query(
      `SELECT ti.*, p.name AS product_name, p.unit
             FROM transaction_items ti
             JOIN products p ON ti.product_id = p.id
             WHERE ti.transaction_id = $1`,
      [id],
    );

    return successResponse(res, 'Detail transaksi berhasil diambil', {
      ...transaction.rows[0],
      items: items.rows,
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
