const express = require("express");
const multer = require("multer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

  const result = await model.generateContent([
    INVOICE_PROMPT,
    { inlineData: { data: base64, mimeType: req.file.mimetype } },
  ]);

  const text = result.response.text();
  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();

  let invoice;
  try {
    invoice = JSON.parse(cleaned);
  } catch {
    return res.status(502).json({ error: "Failed to parse Gemini response", raw: cleaned });
  }

  res.json({ success: true, data: invoice });
});

module.exports = router;
