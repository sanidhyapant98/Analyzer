require("dotenv").config();
const path = require("path");
const express = require("express");
const { connectToDb } = require("./config/db");
const analyzeRoutes = require("./routes/analyze.routes");

const app = express();

// Limit JSON body size to 10kb — basic protection against oversized requests
app.use(express.json({ limit: "10kb" }));

// API routes
app.use("/api", analyzeRoutes);

// Unknown API route (e.g. /api/whatever) → JSON 404.
// Registered before static so API paths never return HTML.
app.use("/api", (req, res) => {
  res.status(404).json({ success: false, error: "Route not found." });
});

// Serve the built React app (client/dist) — run `npm run build` in
// the client folder first so this folder exists.
const clientDistPath = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDistPath));

// Single-page-app fallback (Express 5 no longer accepts a bare "*" wildcard).
// Any GET that reached this point is not an API path and not a real file,
// so return index.html and let React handle the route in the browser.
app.use((req, res) => {
  if (req.method !== "GET") {
    return res.status(404).json({ success: false, error: "Route not found." });
  }

  res.sendFile(path.join(clientDistPath, "index.html"), (err) => {
    if (err) {
      res
        .status(500)
        .send("Frontend not built yet. Run: cd client && npm run build");
    }
  });
});

// Global error handler — catches anything controllers pass via next(error).
// Never send stack traces or connection details to the client.
app.use((err, req, res, next) => {
  console.error("Unexpected server error:", err.message);
  res.status(500).json({
    success: false,
    error: "An unexpected server error occurred.",
  });
});

async function startServer() {
  await connectToDb();

  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

startServer();
