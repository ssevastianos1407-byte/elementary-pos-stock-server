const express = require("express");
const fs = require("fs");
const XLSX = require("xlsx");
const multer = require("multer");

const app = express();
app.use(express.json());

const upload = multer({ dest: "uploads/" });
const STOCK_FILE = "stock.json";

let stock = {};

// Load stock from disk
if (fs.existsSync(STOCK_FILE)) {
  stock = JSON.parse(fs.readFileSync(STOCK_FILE));
}

// Save stock to disk
function saveStock() {
  fs.writeFileSync(STOCK_FILE, JSON.stringify(stock, null, 2));
}

// Upload initial or restock Excel
app.post("/upload-stock", upload.single("file"), (req, res) => {
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

  res.json({ status: "Stock updated", items: Object.keys(stock).length });
});

// Receipt webhook (sale)
app.get("/webhook", (req, res) => {
  // Elementary does NOT give product list here
  // So we only mark that a sale happened
  // (future-proof hook, keeps compatibility)
  res.send("OK");
});

// Public stock
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
