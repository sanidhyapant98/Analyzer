require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("Missing MONGODB_URI. Check your .env file.");
  process.exit(1);
}

// One client instance = one connection shared by the whole app.
// serverSelectionTimeoutMS: fail after 5s instead of MongoDB's default
// 30s, so a down database produces a quick, clear error.
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

async function connectToDb() {
  try {
    await client.connect();
    console.log("Connected to MongoDB successfully.");
    return client.db("query_analyzer");
  } catch (error) {
    console.error("Could not connect to MongoDB:", error.message);
    process.exit(1);
  }
}

function getDb() {
  return client.db("query_analyzer");
}

async function closeDb() {
  await client.close();
}

module.exports = { connectToDb, getDb, closeDb };
