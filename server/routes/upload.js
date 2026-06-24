const express = require("express");
const multer = require("multer");
const Anthropic = require("@anthropic-ai/sdk");
const { saveInvoice } = require("../models/invoice");

const router = express.Router();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, WEBP, and PDF are allowed."));
    }
  },
});

const INVOICE_PROMPT = `Extract all invoice data from this document and return it as a JSON object with this structure:
{
  "invoice_number": "",
  "invoice_date": "",
  "due_date": "",
  "vendor": { "name": "", "address": "", "email": "", "phone": "" },
  "customer": { "name": "", "address": "", "email": "", "phone": "" },
  "line_items": [{ "description": "", "quantity": 0, "unit_price": 0, "total": 0 }],
  "subtotal": 0,
  "tax": 0,
  "discount": 0,
  "total": 0,
  "currency": "",
  "notes": ""
}
Return ONLY the JSON object with no additional text or markdown formatting.`;

router.post("/upload", upload.single("invoice"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const base64 = req.file.buffer.toString("base64");
  const ispdf = req.file.mimetype === "application/pdf";

  const fileContent = ispdf
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
    : { type: "image", source: { type: "base64", media_type: req.file.mimetype, data: base64 } };

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: [{ type: "text", text: INVOICE_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: [fileContent] }],
  });

  const text = response.content[0].text;
  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();

  let invoice;
  try {
    invoice = JSON.parse(cleaned);
  } catch {
    return res.status(502).json({ error: "Failed to parse Claude response", raw: cleaned });
  }

  const saved = await saveInvoice(invoice);
  res.json({ success: true, data: saved });
});

module.exports = router;
