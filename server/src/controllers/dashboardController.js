import pool from '../config/db.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

/**
 * GET /api/v1/dashboard/summary
 * Ringkasan dashboard:
 * - Omzet hari ini
 * - Omzet bulan ini
 * - Jumlah transaksi hari ini
 * - Estimasi keuntungan bulan ini
 * - Produk terlaris (top 5)
 * - Produk stok menipis (stok <= 5)
 */
export const getDashboardSummary = async (_req, res) => {
    try {
        // Omzet hari ini
        const todayRevenue = await pool.query(
            `SELECT COALESCE(SUM(total), 0) AS revenue
             FROM transactions
             WHERE created_at::date = CURRENT_DATE`
        );

        // Omzet bulan ini
        const monthRevenue = await pool.query(
            `SELECT COALESCE(SUM(total), 0) AS revenue
             FROM transactions
             WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)`
        );

        // Jumlah transaksi hari ini
        const todayTransactions = await pool.query(
            `SELECT COUNT(*) AS count
             FROM transactions
             WHERE created_at::date = CURRENT_DATE`
        );

        // Estimasi keuntungan bulan ini
        // Keuntungan = SUM((selling_price - purchase_price) * quantity) per bulan
        const monthProfit = await pool.query(
            `SELECT COALESCE(SUM((ti.unit_price - p.purchase_price) * ti.quantity), 0) AS profit
             FROM transaction_items ti
             JOIN products p ON ti.product_id = p.id
             JOIN transactions t ON ti.transaction_id = t.id
             WHERE DATE_TRUNC('month', t.created_at) = DATE_TRUNC('month', CURRENT_DATE)`
        );

        // Produk terlaris (top 5 bulan ini)
        const topProducts = await pool.query(
            `SELECT p.id, p.name, p.unit, SUM(ti.quantity) AS total_sold
             FROM transaction_items ti
             JOIN products p ON ti.product_id = p.id
             JOIN transactions t ON ti.transaction_id = t.id
             WHERE DATE_TRUNC('month', t.created_at) = DATE_TRUNC('month', CURRENT_DATE)
             GROUP BY p.id, p.name, p.unit
             ORDER BY total_sold DESC
             LIMIT 5`
        );

        // Produk stok menipis (stok <= 5)
        const lowStockProducts = await pool.query(
            `SELECT id, name, stock, unit
             FROM products
             WHERE stock <= 5
             ORDER BY stock ASC
             LIMIT 10`
        );

        return successResponse(res, 'Dashboard summary berhasil diambil', {
            today_revenue: parseFloat(todayRevenue.rows[0].revenue),
            month_revenue: parseFloat(monthRevenue.rows[0].revenue),
            today_transactions: parseInt(todayTransactions.rows[0].count),
            month_profit_estimate: parseFloat(monthProfit.rows[0].profit),
            top_products: topProducts.rows,
            low_stock_products: lowStockProducts.rows,
        });
    } catch (error) {
        return errorResponse(res, error.message);
    }
};
