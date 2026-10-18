require("dotenv").config();
const express = require("express");
const { connectToDb } = require("./config/db");

const app = express();

// Limit JSON body size to 10kb — basic protection against oversized requests
app.use(express.json({ limit: "10kb" }));

app.get("/", (req, res) => {
  res.json({ message: "Mini MongoDB Query Analyzer API is running." });
});

async function startServer() {
  await connectToDb();

  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

startServer();
