const { getDb } = require("../config/db");
const { extractStages } = require("../utils/extractStages");

const COLLECTION_NAME = "users";

/**
 * Analyzes a MongoDB find() filter and returns real execution statistics.
 *
 * @param {Object} filter - a plain MongoDB filter object
 * @returns {Object} structured stats for the frontend
 */
async function analyzeQuery(filter) {
  const db = getDb();
  const users = db.collection(COLLECTION_NAME);

  // explain("executionStats") RUNS the query and reports what happened.
  const explainResult = await users.find(filter).explain("executionStats");

  // MongoDB's explain document has a few top-level keys. The useful
  // execution numbers live under "executionStats".
  const stats = explainResult.executionStats;

  if (!stats) {
    // Never fabricate numbers. If MongoDB didn't give us stats, say so.
    const error = new Error("MongoDB did not return execution statistics.");
    error.statusCode = 500;
    throw error;
  }

  return {
    filter,
    executionTimeMs: stats.executionTimeMillis,
    documentsExamined: stats.totalDocsExamined,
    documentsReturned: stats.nReturned,
    keysExamined: stats.totalKeysExamined,
    executionStages: extractStages(stats.executionStages),
  };
}

module.exports = { analyzeQuery };
