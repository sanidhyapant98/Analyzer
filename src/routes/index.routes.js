const express = require("express");
const {
  handleListIndexes,
  handleCreateIndex,
  handleDropIndex,
} = require("../controllers/index.controller");

const router = express.Router();

// GET /api/indexes — list indexes on the users collection
router.get("/indexes", handleListIndexes);

// POST /api/indexes — create a single-field index
router.post("/indexes", handleCreateIndex);

// DELETE /api/indexes/:name — drop an index by name
router.delete("/indexes/:name", handleDropIndex);

module.exports = router;
