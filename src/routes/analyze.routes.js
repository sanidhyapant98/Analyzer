const express = require("express");
const { handleAnalyze } = require("../controllers/analyze.controller");

const router = express.Router();

// POST /api/analyze
router.post("/analyze", handleAnalyze);

module.exports = router;
