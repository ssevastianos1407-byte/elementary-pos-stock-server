const express = require("express");
const fs = require("fs");
const XLSX = require("xlsx");
const multer = require("multer");

const app = express();
const upload = multer({ dest: "uploads/" });
const STOCK_FILE = "stock.json";

let stock = {};

// Load saved stock
if (fs.existsSync(STOCK_FILE)) {
  try {
    stock = JSON.parse(fs.readFileSync(STOCK_FILE, "utf-8"));
  } catch {
    stock = {};
  }
}

function saveStock() {
  fs.writeFileSync(STOCK_FILE, JSON.stringify(stock, null, 2));
}

// --------------------
// Upload page
// --------------------
app.get("/upload", (req, res) => {
  res.send(`
    <h2>Upload Elementary POS Stock</h2>
    <form action="/upload-stock" method="post" enctype="multipart/form-data">
      <input type="file" name="file" required />
      <br><br>
      <button type="submit">Upload</button>
    </form>
  `);
});

// --------------------
// Handle Excel upload
// --------------------
app.post("/upload-stock", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  const workbook = XLSX.readFile(req.file.path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  // IMPORTANT: start reading from row 7
  const rows = XLSX.utils.sheet_to_json(sheet, {
    range: 6, // zero-based index → row 7
    defval: ""
  });

  let count = 0;

  rows.forEach(row => {
    const name = row["Item name"];
    const qty = Number(row["In stock"]);

    if (!name || isNaN(qty)) return;

    stock[name] = qty;
    count++;
  });

  saveStock();
  fs.unlinkSync(req.file.path);

  res.send(`
    <h3>✅ Stock loaded successfully</h3>
    <p>Products imported: ${count}</p>
    <a href="/stock">View stock</a>
  `);
});

// --------------------
// Public stock endpoint
// --------------------
app.get("/stock", (req, res) => {
  const list = Object.entries(stock)
    .filter(([_, qty]) => qty > 0)   // 👈 hide zero stock
    .map(([name, qty]) => ({
      name,
      stock: qty
    }));

  res.json(list);
});


// --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
