const express = require("express");
const pool = require("../db/pool");
const requireAuth = require("../middleware/auth");

const router = express.Router();

router.get("/dashboard", requireAuth, async (req, res, next) => {
  try {
    const [totalResult, vendorsResult, monthlyResult] = await Promise.all([
      pool.query("SELECT COALESCE(SUM(total), 0) AS total_spend FROM invoices"),
      pool.query(`
        SELECT vendor_name, COALESCE(SUM(total), 0) AS total
        FROM invoices
        WHERE vendor_name IS NOT NULL AND vendor_name <> ''
        GROUP BY vendor_name
        ORDER BY total DESC
        LIMIT 5
      `),
      pool.query(`
        SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
               COALESCE(SUM(total), 0) AS total
        FROM invoices
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at)
      `),
    ]);

    res.json({
      total_spend: Number(totalResult.rows[0].total_spend),
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
