require("dotenv").config();
const { connectToDb, closeDb } = require("../src/config/db");
const { analyzeQuery } = require("../src/services/analyze.service");

async function test() {
  await connectToDb();

  const testCases = [
    { label: "Empty filter (scans everything)", filter: {} },
    { label: "Age > 40", filter: { age: { $gt: 40 } } },
    { label: "City = Delhi", filter: { city: "Delhi" } },
    { label: "Role = developer AND age > 30", filter: { role: "developer", age: { $gt: 30 } } },
    { label: "Matches nothing", filter: { age: { $gt: 200 } } },
  ];

  for (const testCase of testCases) {
    console.log("\n--- " + testCase.label + " ---");
    try {
      const result = await analyzeQuery(testCase.filter);
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error("FAILED:", error.message);
    }
  }

  await closeDb();
}

test().catch((e) => { console.error(e); process.exit(1); });
