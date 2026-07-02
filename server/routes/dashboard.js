const express = require("express");
const pool = require("../db/pool");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.get("/dashboard", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const [totalResult, vendorsResult, monthlyResult] = await Promise.all([
      pool.query(
        "SELECT COALESCE(SUM(total), 0) AS total_spend, COUNT(*) AS invoice_count FROM invoices WHERE user_id = $1",
        [userId]
      ),
      pool.query(
        `SELECT vendor_name, COALESCE(SUM(total), 0) AS total
         FROM invoices
         WHERE user_id = $1 AND vendor_name IS NOT NULL AND vendor_name <> ''
         GROUP BY vendor_name
         ORDER BY total DESC
         LIMIT 5`,
        [userId]
      ),
      pool.query(
        `SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
                COALESCE(SUM(total), 0) AS total
         FROM invoices
         WHERE user_id = $1
         GROUP BY DATE_TRUNC('month', created_at)
         ORDER BY DATE_TRUNC('month', created_at)`,
        [userId]
      ),
    ]);

    res.json({
      total_spend: Number(totalResult.rows[0].total_spend),
      invoice_count: Number(totalResult.rows[0].invoice_count),
      top_vendors: vendorsResult.rows.map((r) => ({
        vendor_name: r.vendor_name,
        total: Number(r.total),
      })),
      monthly_breakdown: monthlyResult.rows.map((r) => ({
        month: r.month,
        total: Number(r.total),
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
