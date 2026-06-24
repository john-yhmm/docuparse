const pool = require("../db/pool");

async function saveInvoice(data) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `INSERT INTO invoices
        (invoice_number, invoice_date, due_date,
         vendor_name, vendor_address, vendor_email, vendor_phone,
         customer_name, customer_address, customer_email, customer_phone,
         subtotal, tax, discount, total, currency, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [
        data.invoice_number,
        data.invoice_date,
        data.due_date,
        data.vendor?.name,
        data.vendor?.address,
        data.vendor?.email,
        data.vendor?.phone,
        data.customer?.name,
        data.customer?.address,
        data.customer?.email,
        data.customer?.phone,
        data.subtotal,
        data.tax,
        data.discount,
        data.total,
        data.currency,
        data.notes,
      ]
    );

    const invoice = rows[0];

    const lineItems = [];
    for (const item of data.line_items ?? []) {
      const { rows: itemRows } = await client.query(
        `INSERT INTO line_items (invoice_id, description, quantity, unit_price, total)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING *`,
        [invoice.id, item.description, item.quantity, item.unit_price, item.total]
      );
      lineItems.push(itemRows[0]);
    }

    await client.query("COMMIT");
    return { ...invoice, line_items: lineItems };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { saveInvoice };
