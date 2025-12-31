const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

let cachedStock = [];

// Fetch stock from Elementary POS
async function updateStock() {
  try {
    const response = await axios.get(
      `${process.env.ELEMENTARY_BASE_URL}/products`,
      {
        headers: {
          Authorization: `Bearer ${process.env.ELEMENTARY_API_KEY}`
        }
      }
    );

    cachedStock = response.data.map(p => ({
      name: p.name,
      stock: p.stock
    }));

    console.log("Stock updated");
  } catch (err) {
    console.error("Failed to update stock");
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

// Initial fetch
updateStock();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
