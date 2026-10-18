require("dotenv").config();
const { connectToDb, closeDb } = require("../src/config/db");

// ---------------------------------------------------------------
// Sample data pools — mixed so queries return interesting subsets
// ---------------------------------------------------------------
const names = [
  "Alice", "Bob", "Charlie", "Diana", "Ethan", "Fiona", "George", "Hannah",
  "Ivan", "Julia", "Kevin", "Laura", "Mike", "Nina", "Oscar", "Priya",
  "Quentin", "Rachel", "Sam", "Tina", "Umesh", "Vera", "William", "Xena",
  "Yusuf", "Zara", "Arjun", "Meera", "Rahul", "Sneha", "Amit", "Kavya",
  "Dev", "Ananya", "Rohan", "Ishita", "Karan", "Pooja", "Aditya", "Neha",
];

const cities = [
  "Delhi", "Mumbai", "Bangalore", "Hyderabad", "Chennai",
  "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow",
];

const roles = [
  "developer", "designer", "manager", "analyst", "devops",
  "qa", "support", "architect", "intern", "lead",
];

// A simple deterministic pseudo-random generator so repeated runs
// produce the same dataset (helpful when comparing query plans).
let seed = 42;
function random() {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
}

function pick(arr) {
  return arr[Math.floor(random() * arr.length)];
}

function generateUsers(count) {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push({
      name: pick(names) + " " + (i + 1),
      age: 21 + Math.floor(random() * 40), // 21 to 60
      city: pick(cities),
      role: pick(roles),
    });
  }
  return users;
}

// ---------------------------------------------------------------
// Main seed logic
// ---------------------------------------------------------------
async function seedDb() {
  const db = await connectToDb();
  const users = db.collection("users");

  // Clear existing data so the script can be re-run safely
  await users.deleteMany({});

  const documents = generateUsers(500);
  const result = await users.insertMany(documents);

  const count = await users.countDocuments();
  console.log(`Inserted ${result.insertedCount} documents.`);
  console.log(`Total documents in users collection: ${count}`);

  // Quick sanity check — a simple find() query
  const sample = await users.find({ age: { $gt: 50 } }).limit(3).toArray();
  console.log("Sample users older than 50:", sample);

  await closeDb();
  console.log("Seeding complete.");
}

seedDb().catch((error) => {
  console.error("Seeding failed:", error.message);
  process.exit(1);
});
