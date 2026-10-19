import pool from '../config/db.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

/**
 * GET /api/v1/reports/sales
 * Laporan penjualan dengan filter:
 * - ?type=daily   → laporan hari ini
 * - ?type=weekly  → laporan 7 hari terakhir
 * - ?type=monthly → laporan bulan ini
 * - ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD → filter custom
 */
export const getSalesReport = async (req, res) => {
    try {
        const { type, start_date, end_date } = req.query;

        let dateFilter = '';
        const params = [];

        if (start_date && end_date) {
            // Filter custom berdasarkan tanggal
            dateFilter = 't.created_at::date BETWEEN $1 AND $2';
            params.push(start_date, end_date);
        } else {
            switch (type) {
                case 'daily':
                    dateFilter = 't.created_at::date = CURRENT_DATE';
                    break;
                case 'weekly':
                    dateFilter = 't.created_at::date >= CURRENT_DATE - INTERVAL \'7 days\'';
                    break;
                case 'monthly':
                default:
                    dateFilter = 'DATE_TRUNC(\'month\', t.created_at) = DATE_TRUNC(\'month\', CURRENT_DATE)';
                    break;
            }
        }

        // Total omzet
        const revenueResult = await pool.query(
            `SELECT COALESCE(SUM(t.total), 0) AS total_revenue,
                    COUNT(t.id) AS total_transactions
             FROM transactions t
             WHERE ${dateFilter}`,
            params
        );

        // Estimasi keuntungan
        const profitResult = await pool.query(
            `SELECT COALESCE(SUM((ti.unit_price - p.purchase_price) * ti.quantity), 0) AS total_profit
             FROM transaction_items ti
             JOIN products p ON ti.product_id = p.id
             JOIN transactions t ON ti.transaction_id = t.id
             WHERE ${dateFilter}`,
            params
        );

        // Detail per hari (breakdown)
        const dailyBreakdown = await pool.query(
            `SELECT t.created_at::date AS date,
                    COUNT(t.id) AS transactions,
                    COALESCE(SUM(t.total), 0) AS revenue
             FROM transactions t
             WHERE ${dateFilter}
             GROUP BY t.created_at::date
             ORDER BY date DESC`,
            params
        );

        // Produk terlaris dalam periode ini
        const topProducts = await pool.query(
            `SELECT p.id, p.name, p.unit,
                    SUM(ti.quantity) AS total_sold,
                    SUM(ti.subtotal) AS total_revenue
             FROM transaction_items ti
             JOIN products p ON ti.product_id = p.id
             JOIN transactions t ON ti.transaction_id = t.id
             WHERE ${dateFilter}
             GROUP BY p.id, p.name, p.unit
             ORDER BY total_sold DESC
             LIMIT 10`,
            params
        );

        return successResponse(res, 'Laporan penjualan berhasil diambil', {
            period: type || 'custom',
            total_revenue: parseFloat(revenueResult.rows[0].total_revenue),
            total_transactions: parseInt(revenueResult.rows[0].total_transactions),
            total_profit_estimate: parseFloat(profitResult.rows[0].total_profit),
            daily_breakdown: dailyBreakdown.rows,
            top_products: topProducts.rows,
        });
    } catch (error) {
        return errorResponse(res, error.message);
    }
};
