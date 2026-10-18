require("dotenv").config();
const { connectToDb, closeDb } = require("../src/config/db");

async function verify() {
  const db = await connectToDb();
  const users = db.collection("users");

  const total = await users.countDocuments();
  console.log("Total documents:", total);

  const ageGroups = await users
    .aggregate([{ $group: { _id: "$age", count: { $sum: 1 } } }])
    .toArray();
  const ages = ageGroups.map((g) => g._id).sort((a, b) => a - b);
  console.log("Age range:", ages[0], "to", ages[ages.length - 1]);

  const byCity = await users
    .aggregate([{ $group: { _id: "$city", count: { $sum: 1 } } }, { $sort: { count: -1 } }])
    .toArray();
  console.log("Documents per city:", byCity);

  const byRole = await users
    .aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }, { $sort: { count: -1 } }])
    .toArray();
  console.log("Documents per role:", byRole);

  const olderThan40 = await users.countDocuments({ age: { $gt: 40 } });
  console.log('Count of { "age": { "$gt": 40 } }:', olderThan40);

  await closeDb();
}

verify().catch((e) => { console.error(e.message); process.exit(1); });
