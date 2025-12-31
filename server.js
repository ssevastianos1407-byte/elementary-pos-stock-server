const express = require("express");
const fs = require("fs");
const XLSX = require("xlsx");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(express.json());

const upload = multer({ dest: "uploads/" });
const STOCK_FILE = "stock.json";

let stock = {};

// Load stock from disk if it exists
if (fs.existsSync(STOCK_FILE)) {
  try {
    stock = JSON.parse(fs.readFileSync(STOCK_FILE, "utf-8"));
  } catch (e) {
    stock = {};
  }
}

// Save stock to disk
function saveStock() {
  fs.writeFileSync(STOCK_FILE, JSON.stringify(stock, null, 2));
}

// ===============================
// SIMPLE UPLOAD PAGE (NO TOOLS)
// ===============================
app.get("/upload", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Upload Stock</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="font-family: Arial; padding: 20px;">
      <h2>Upload Stock Excel</h2>
      <form action="/upload-stock" method="post" enctype="multipart/form-data">
        <input type="file" name="file" required />
        <br><br>
        <button type="submit">Upload</button>
      </form>
    </body>
    </html>
  `);
});

// ===============================
// HANDLE EXCEL UPLOAD (INITIAL + RESTOCK)
// ===============================
app.post("/upload-stock", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  const workbook = XLSX.readFile(req.file.path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  rows.forEach(row => {
    const name =
      row["Product"] ||
      row["Product Name"] ||
      row["Name"];

    const qty =
      row["Quantity"] ||
      row["Stock"] ||
      row["Available"];

    if (!name || qty === undefined) return;

    stock[name] = (stock[name] || 0) + Number(qty);
  });

  saveStock();
  fs.unlinkSync(req.file.path);

  res.send(`
    <h3>Stock updated successfully ✅</h3>
    <p>Total products: ${Object.keys(stock).length}</p>
    <a href="/stock">View stock</a>
  `);
});

// ===============================
// WEBHOOK (RECEIPTS - FUTURE USE)
// ===============================
app.get("/webhook", (req, res) => {
  res.status(200).send("OK");
});

// ===============================
// PUBLIC STOCK API
// ===============================
app.get("/stock", (req, res) => {
  const list = Object.entries(stock).map(([name, qty]) => ({
    name,
    stock: qty
  }));
  res.json(list);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
