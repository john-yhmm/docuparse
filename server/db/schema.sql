CREATE TABLE IF NOT EXISTS invoices (
  id               SERIAL PRIMARY KEY,
  invoice_number   TEXT,
  invoice_date     TEXT,
  due_date         TEXT,
  vendor_name      TEXT,
  vendor_address   TEXT,
  vendor_email     TEXT,
  vendor_phone     TEXT,
  customer_name    TEXT,
  customer_address TEXT,
  customer_email   TEXT,
  customer_phone   TEXT,
  subtotal         NUMERIC,
  tax              NUMERIC,
  discount         NUMERIC,
  total            NUMERIC,
  currency         TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS line_items (
  id          SERIAL PRIMARY KEY,
  invoice_id  INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT,
  quantity    NUMERIC,
  unit_price  NUMERIC,
  total       NUMERIC
);
