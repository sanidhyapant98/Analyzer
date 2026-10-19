# Mini MongoDB Query Analyzer

A beginner-friendly web application that analyzes MongoDB `find()` queries and displays **real** execution statistics using MongoDB's `explain("executionStats")`.

Enter a JSON filter, click **Analyze**, and see how MongoDB actually executed your query: how long it took, how many documents it examined, how many it returned, how many index keys it touched, and whether it performed a collection scan (`COLLSCAN`) or an index scan (`IXSCAN`).

> This project reports what MongoDB did. It does **not** judge, optimize, or rewrite queries.

---

## Features

- Analyze a read-only `find()` filter against a predefined `users` collection
- Display 5 execution statistics: time, docs examined, docs returned, keys examined, scan stages
- Detect `COLLSCAN` and `IXSCAN` by recursively walking nested execution plans
- Basic index management on the `users` collection: list, create (single-field), and drop indexes
- Validate JSON input on both the frontend and the backend
- Block the `$where` operator (it executes arbitrary JavaScript on the database)
- Safe error handling: no stack traces, credentials, or connection details ever reach the browser
- Request body size limit (10kb)

### Explicitly NOT included (by design)

No AI, no automatic recommendations, no index suggestions, no compound-index builder, no query rewriting, no auth, no charts, no aggregation analysis, no caching, no Docker/Kubernetes. The index manager only does what you tell it — it never decides which indexes you need.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express 5 |
| Database driver | Official MongoDB Node.js Driver |
| Frontend | React 19 (Vite), MUI |
| Dev tools | Nodemon, dotenv |
| Database | MongoDB (local or Atlas) |

JavaScript only. No TypeScript, no Mongoose, no ORM.

---

## Project Structure

```
Analyzer/
│
├── src/
│   ├── config/
│   │   └── db.js                  # MongoDB connection (one shared client)
│   ├── routes/
│   │   ├── analyze.routes.js      # POST /api/analyze route
│   │   └── index.routes.js        # GET/POST/DELETE /api/indexes routes
│   ├── controllers/
│   │   ├── analyze.controller.js  # Validates input, shapes responses
│   │   └── index.controller.js    # Validates index create/drop requests
│   ├── services/
│   │   ├── analyze.service.js     # Runs find().explain("executionStats")
│   │   └── index.service.js       # listIndexes / createIndex / dropIndex
│   ├── utils/
│   │   └── extractStages.js       # Recursively finds COLLSCAN/IXSCAN
│   └── server.js                  # Express entry point
│
├── client/                        # React + MUI frontend
│   ├── src/
│   │   ├── App.jsx                # Analyzer UI
│   │   └── components/
│   │       └── IndexManager.jsx   # List / create / drop indexes
│   └── vite.config.js             # Dev proxy /api -> :5000
│
├── scripts/
│   ├── seed.js                    # Inserts 500 sample users
│   ├── verify.js                  # Prints data distribution
│   ├── test-analyze.js            # Service-level tests
│   └── test-e2e.js                # HTTP + index experiment tests
│
├── .env                           # Your credentials (NEVER committed)
├── .env.example                   # Template for other developers
├── .gitignore
├── package.json
└── README.md
```

---

## Prerequisites

1. **Node.js** 18 or newer (includes `fetch` for tests)
2. **npm**
3. A **MongoDB** instance:
   - MongoDB Atlas (free tier is fine), or
   - A local MongoDB server running on `127.0.0.1:27017`
4. *(Optional)* MongoDB Compass for browsing your data

---

## Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd Analyzer

# 2. Install backend dependencies
npm install

# 3. Install frontend dependencies and build it
npm run setup

# 4. Create your environment file
cp .env.example .env
#    Then edit .env with your MongoDB connection string
```

### Environment Variables

`.env` file:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
PORT=5000
```

| Variable | Description | Example |
|---|---|---|
| `MONGODB_URI` | Full MongoDB connection string | `mongodb://127.0.0.1:27017` |
| `PORT` | Port Express listens on | `5000` |

> ⚠️ Never commit `.env`. It is listed in `.gitignore` and must stay that way.

---

## Database Seeding

The analyzer needs data to analyze. The seed script creates the `query_analyzer` database, the `users` collection, and inserts **500 sample documents**:

```bash
npm run seed
```

Expected output:

```
Inserted 500 documents.
Total documents in users collection: 500
Sample users older than 50: [ ... ]
Seeding complete.
```

The script deletes existing documents first, so it is safe to re-run at any time.

**Sample document shape:**

```json
{
  "name": "Alice 12",
  "age": 34,
  "city": "Delhi",
  "role": "developer"
}
```

---

## Running the Application

```bash
# Build the frontend once (required)
npm run build

# Start the server
npm run dev        # during development (auto-restart with nodemon)
# or
npm start          # production
```

Then open **http://localhost:5000** in your browser.

### Hot-reload development (two terminals)

```bash
npm run client     # terminal 1: Vite dev server on :5173
npm run dev        # terminal 2: Express API on :5000
```

Use `http://localhost:5173` — the Vite proxy forwards `/api` requests to Express automatically.

---

## API Reference

### `POST /api/analyze`

Analyzes a `find()` filter against the `users` collection.

**Request body:**

```json
{
  "filter": { "age": { "$gt": 40 } }
}
```

**Example with curl:**

```bash
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"filter":{"age":{"$gt":40}}}'
```

**Success response — `200`:**

```json
{
  "success": true,
  "data": {
    "filter": { "age": { "$gt": 40 } },
    "executionTimeMs": 1,
    "documentsExamined": 500,
    "documentsReturned": 243,
    "keysExamined": 0,
    "executionStages": ["COLLSCAN"]
  }
}
```

**Error responses:**

| Status | When | Example body |
|---|---|---|
| `400` | Missing or non-object `filter` | `{"success":false,"error":"Missing required field \"filter\"."}` |
| `400` | Invalid MongoDB operator | `{"success":false,"error":"MongoDB rejected this filter: unknown operator: $weird"}` |
| `400` | Blocked `$where` operator | `{"success":false,"error":"The \"$where\" operator is not allowed."}` |
| `404` | Unknown API route | `{"success":false,"error":"Route not found."}` |
| `500` | Unexpected server error | `{"success":false,"error":"An unexpected server error occurred."}` |

### `GET /api/indexes`

Lists the indexes on the `users` collection.

```bash
curl http://localhost:5000/api/indexes
```

**Success response — `200`:**

```json
{
  "success": true,
  "data": [
    { "name": "_id_", "key": { "_id": 1 } },
    { "name": "age_1", "key": { "age": 1 } }
  ]
}
```

### `POST /api/indexes`

Creates a **single-field** index on the `users` collection. Compound (multi-field) indexes are rejected — this tool stays basic on purpose.

**Request body:**

```json
{
  "key": { "age": 1 },
  "name": "optional_custom_name"
}
```

Only `key` is required. Direction values must be `1`, `-1`, `"text"`, or `"hashed"`.

```bash
curl -X POST http://localhost:5000/api/indexes \
  -H "Content-Type: application/json" \
  -d '{"key":{"age":1}}'
```

**Success response — `201`:**

```json
{ "success": true, "data": { "name": "age_1", "key": { "age": 1 } } }
```

**Error responses:**

| Status | When |
|---|---|
| `400` | Missing or invalid `key`, more than one field, bad direction, name too long |
| `400` | MongoDB rejects the index (e.g. conflicting definition) |

### `DELETE /api/indexes/:name`

Drops an index by name. The default `_id_` index cannot be dropped.

```bash
curl -X DELETE http://localhost:5000/api/indexes/age_1
```

**Success response — `200`:**

```json
{ "success": true, "data": { "dropped": "age_1" } }
```

**Error responses:**

| Status | When |
|---|---|
| `400` | Attempt to drop `_id_` |
| `400` | Index does not exist |

---

## Understanding the Execution Statistics

| Metric | Meaning | Real-world analogy |
|---|---|---|
| **Execution Time** (`executionTimeMillis`) | How long MongoDB took to run the query, in milliseconds | How long you wandered the library |
| **Documents Examined** (`totalDocsExamined`) | How many documents MongoDB opened and looked at | How many books you pulled off the shelf |
| **Documents Returned** (`nReturned`) | How many documents actually matched your filter | How many books you kept |
| **Index Keys Examined** (`totalKeysExamined`) | How many index entries MongoDB read | How many entries you checked in the card catalog |
| **Scan Type** (`executionStages`) | `COLLSCAN`, `IXSCAN`, or both | Walking every aisle vs. using the catalog |

### Why do "examined" and "returned" differ?

If you search for `city: "Delhi"` with no index, MongoDB must read **all 500** documents to find the **57** that match. Examined = 500, returned = 57. With an index on `city`, MongoDB reads only the matching entries.

### What do COLLSCAN and IXSCAN mean?

- **COLLSCAN (Collection Scan):** MongoDB checked every single document — like walking every aisle in a library.
- **IXSCAN (Index Scan):** MongoDB used an index to jump directly to matching documents — like looking up the topic in the card catalog first.

Neither is reported as "good" or "bad" by this app. An index is not always faster: on a small collection, or when a query matches most documents, MongoDB's planner may rationally choose a collection scan.

### Does adding an index guarantee a faster query?

No. The query planner weighs collection size, selectivity, and cached plans. On a 500-document collection, MongoDB may still pick `COLLSCAN` even when a suitable index exists. Always measure — that is exactly what this tool is for.

### Why does execution time vary between runs?

Timing depends on cache state, network conditions, server load, and background activity. Documents examined and keys examined are far more stable indicators than milliseconds.

---

## Testing

```bash
# Service-level tests (no server needed)
node scripts/test-analyze.js

# Data distribution check
node scripts/verify.js

# Full end-to-end tests (server must be running first)
npm run dev                      # terminal 1
node scripts/test-e2e.js         # terminal 2
```

### The index experiment

Try this in the browser (or with curl) to see an index change the plan:

1. Analyze `{ "age": { "$gt": 40 } }` → `COLLSCAN`, 500 docs examined
2. In the Index Manager, create an index on `age` (direction `1`)
3. Analyze the same filter again → `IXSCAN`, 243 docs examined, 243 keys examined
4. Drop the index → the next analysis goes back to `COLLSCAN`

```
BEFORE index:  docsExamined=500  keysExamined=0    COLLSCAN
AFTER  index:  docsExamined=243  keysExamined=243  IXSCAN
```

`scripts/test-e2e.js` automates the same experiment (create index → re-analyze → drop index). Remember: on a small collection MongoDB may still pick `COLLSCAN` even when a suitable index exists — always measure, never assume.

---

## Security Notes

- Only JSON filter objects are accepted — never arbitrary JavaScript
- The collection is hardcoded to `users`; users cannot choose databases or collections
- The `$where` operator is rejected
- Request bodies are limited to 10kb
- Errors returned to the browser contain messages only — never stack traces or connection strings
- `.env` is gitignored
- For a production read-only account, create a MongoDB user with `read` permissions only

---

## Current Limitations

- Read-only `find()` queries against one predefined collection (`users`)
- Index management is basic: list, create single-field indexes, drop — no compound indexes, no partial/TTL/unique options, no suggestions
- No query history, comparison, or benchmarking
- No aggregation pipeline analysis
- No automatic index or query recommendations
- No authentication or multi-user support
- Small sample data (500 documents) — statistics on production-scale collections will differ
- A single filter per request; no saved reports

---

## License

MIT
