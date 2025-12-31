const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

let cachedStock = [];

// Fetch stock from Elementary POS
async function updateStock() {
  try {
    const response = await axios.get(
      "https://app.elementarypos.com/api/products",
      {
        headers: {
          "X-API-KEY": process.env.ELEMENTARY_API_KEY
        }
      }
    );

    cachedStock = response.data.map(p => ({
      name: p.name,
      stock: p.stock_quantity ?? p.stock ?? 0
    }));

    console.log("Stock updated:", cachedStock.length, "products");
  } catch (err) {
    console.error("❌ Failed to update stock");

    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

// Webhook endpoint
app.get("/webhook", async (req, res) => {
  await updateStock();
  res.status(200).send("OK");
});

// Public stock endpoint
app.get("/stock", (req, res) => {
  res.json(cachedStock);
});

// Initial fetch on startup
updateStock();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
