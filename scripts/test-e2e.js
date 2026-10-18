require("dotenv").config();
const { connectToDb, closeDb } = require("../src/config/db");
const { analyzeQuery } = require("../src/services/analyze.service");

// Base URL — set TEST_BASE_URL to test against a running server.
const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:5000";

let passed = 0;
let failed = 0;

function check(label, condition, detail) {
  if (condition) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    failed++;
    console.log(`  FAIL  ${label} — ${detail}`);
  }
}

async function postAnalyze(filter) {
  const response = await fetch(`${BASE_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filter }),
  });
  const body = await response.json();
  return { status: response.status, body };
}

async function runHttpTests() {
  console.log("\n=== HTTP API Tests (against " + BASE_URL + ") ===");

  // 1. Empty filter
  const t1 = await postAnalyze({});
  check("Empty filter returns 200", t1.status === 200, `got ${t1.status}`);
  check("Empty filter examines 500 docs", t1.body.data?.documentsExamined === 500,
    `got ${t1.body.data?.documentsExamined}`);
  check("Empty filter uses COLLSCAN", t1.body.data?.executionStages.includes("COLLSCAN"),
    `got ${JSON.stringify(t1.body.data?.executionStages)}`);

  // 2. Filter matching several documents
  const t2 = await postAnalyze({ age: { $gt: 40 } });
  check("Age>40 returns 200", t2.status === 200, `got ${t2.status}`);
  check("Age>40 returns > 100 docs", t2.body.data?.documentsReturned > 100,
    `got ${t2.body.data?.documentsReturned}`);
  check("Age>40 reports a number for executionTimeMs",
    typeof t2.body.data?.executionTimeMs === "number",
    `got ${t2.body.data?.executionTimeMs}`);

  // 3. Filter matching no documents
  const t3 = await postAnalyze({ age: { $gt: 200 } });
  check("No-match filter returns 200", t3.status === 200, `got ${t3.status}`);
  check("No-match filter returns 0 docs", t3.body.data?.documentsReturned === 0,
    `got ${t3.body.data?.documentsReturned}`);

  // 4. Invalid JSON — must be caught by the frontend before sending.
  // Here we simulate what the browser would send if validation were skipped:
  // it cannot even be represented as JSON, so we send malformed raw body.
  const rawResponse = await fetch(`${BASE_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: '{"filter": {"age": {"$gt": }}',
  });
  check("Malformed JSON body is rejected", rawResponse.status >= 400,
    `got ${rawResponse.status}`);
  const rawBody = await rawResponse.json().catch(() => ({}));
  check("Malformed JSON response is JSON (not HTML)",
    typeof rawBody === "object" && rawBody.success === false,
    `got ${JSON.stringify(rawBody)}`);
  check("Malformed JSON error leaks no stack trace",
    !JSON.stringify(rawBody).includes("at ") &&
    !JSON.stringify(rawBody).includes("node_modules"),
    `leak detected: ${JSON.stringify(rawBody)}`);

  // 5. Unsupported / invalid operator
  const t5 = await postAnalyze({ age: { $weirdOperator: 40 } });
  check("Invalid operator returns 400", t5.status === 400, `got ${t5.status}`);
  check("Invalid operator reports friendly error",
    typeof t5.body.error === "string" && t5.body.error.includes("MongoDB"),
    `got ${JSON.stringify(t5.body)}`);

  // Bonus: missing filter and blocked $where
  const tMissing = await fetch(`${BASE_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  check("Missing filter returns 400", tMissing.status === 400,
    `got ${tMissing.status}`);

  const tWhere = await postAnalyze({ $where: "this.age > 40" });
  check("$where operator blocked with 400", tWhere.status === 400,
    `got ${tWhere.status}`);
}

async function runIndexExperiment() {
  console.log("\n=== Index Experiment (direct service calls) ===");

  const filter = { age: { $gt: 40 } };

  // BEFORE index
  const before = await analyzeQuery(filter);
  console.log("  BEFORE index:", JSON.stringify(before));
  check("Before index: COLLSCAN", before.executionStages.includes("COLLSCAN"),
    `got ${JSON.stringify(before.executionStages)}`);
  check("Before index: 0 keys examined", before.keysExamined === 0,
    `got ${before.keysExamined}`);
  check("Before index: all 500 docs examined", before.documentsExamined === 500,
    `got ${before.documentsExamined}`);

  // Create index manually (testing procedure, NOT an app feature)
  const db = await connectToDb();
  const users = db.collection("users");
  await users.createIndex({ age: 1 }, { name: "age_1" });
  console.log("  Created index: { age: 1 }");

  // AFTER index — note: MongoDB's planner may still pick COLLSCAN on a
  // small collection. That is normal and we report whatever it does.
  const after = await analyzeQuery(filter);
  console.log("  AFTER index: ", JSON.stringify(after));
  check("After index: stats still returned",
    typeof after.executionTimeMs === "number" &&
    typeof after.documentsExamined === "number",
    `got ${JSON.stringify(after)}`);

  const usedIndex = after.executionStages.includes("IXSCAN");
  if (usedIndex) {
    check("After index: IXSCAN detected", true, "");
    check("After index: keys examined > 0", after.keysExamined > 0,
      `got ${after.keysExamined}`);
    console.log(`  IMPROVEMENT: docsExamined ${before.documentsExamined} -> ${after.documentsExamined}`);
  } else {
    console.log("  NOTE: planner still chose COLLSCAN. This is legal on a");
    console.log("  small collection — MongoDB does not guarantee an index is used.");
    console.log("  We report what MongoDB did, without judging it (per spec).");
  }

  // Drop the index so subsequent tests see the original state
  await users.dropIndex("age_1");
  console.log("  Dropped index to restore original state.");
}

async function main() {
  await runHttpTests();
  await runIndexExperiment();
  await closeDb();

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("Test run crashed:", error.message);
  process.exit(1);
});
