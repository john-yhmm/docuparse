const express = require("express");
const pool = require("../db/pool");
const requireAuth = require("../middleware/auth");

const router = express.Router();

function buildWhereClause(query) {
  const { vendor, date_from, date_to, amount_min, amount_max } = query;
  const conditions = [];
  const params = [];

  if (vendor) {
    params.push(`%${vendor}%`);
    conditions.push(`vendor_name ILIKE $${params.length}`);
  }
  if (date_from) {
    params.push(date_from);
    conditions.push(`created_at >= $${params.length}`);
  }
  if (date_to) {
    params.push(date_to);
    conditions.push(`created_at <= $${params.length}`);
  }
  if (amount_min) {
    params.push(Number(amount_min));
    conditions.push(`total >= $${params.length}`);
  }
  if (amount_max) {
    params.push(Number(amount_max));
    conditions.push(`total <= $${params.length}`);
  }

  return { where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "", params };
}

const INVOICE_SELECT = `
  SELECT id, invoice_number, invoice_date, due_date,
         vendor_name, customer_name,
         subtotal, tax, discount, total, currency,
         created_at
  FROM invoices
`;

function csvEscape(value) {
  if (value == null) return "";
  const str = String(value);
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

const CSV_HEADERS = [
  "id", "invoice_number", "invoice_date", "due_date",
  "vendor_name", "customer_name",
  "subtotal", "tax", "discount", "total", "currency",
  "created_at",
];

router.get("/invoices/export", requireAuth, async (req, res, next) => {
  try {
    const { where, params } = buildWhereClause(req.query);
    const { rows } = await pool.query(`${INVOICE_SELECT} ${where} ORDER BY created_at DESC`, params);

    const lines = [CSV_HEADERS.join(",")];
    for (const row of rows) {
      lines.push(CSV_HEADERS.map((col) => csvEscape(row[col])).join(","));
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=invoices.csv");
    res.send(lines.join("\r\n"));
  } catch (err) {
    next(err);
  }
});

router.get("/invoices", requireAuth, async (req, res, next) => {
  try {
    const { where, params } = buildWhereClause(req.query);
    const { rows } = await pool.query(`${INVOICE_SELECT} ${where} ORDER BY created_at DESC`, params);
    res.json(rows.map((r) => ({ ...r, total: Number(r.total) })));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
