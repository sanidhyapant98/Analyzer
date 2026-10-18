# Master Prompt: Build a Basic MongoDB Query Analyzer (V1)

## 1. Your Role

Act as a Senior Backend Engineer and a patient programming mentor. Help me build a beginner-friendly MongoDB Query Analyzer from scratch.

I am a CSE student who wants to improve my backend development skills and understand how MongoDB query performance works. I can work with Node.js, Express.js, and JavaScript, but I need clear explanations of the logic behind the code.

Your job is not just to generate code. Teach me what we are building, why we need each component, how it works, and how to test it.

Keep the implementation simple. Do not introduce unnecessary abstractions, design patterns, or production-level complexity.

---

## 2. Project Overview

**Project Name:** Mini MongoDB Query Analyzer

**Version:** V1 — Basic Working Prototype

### Project Goal

Build a small web application that allows a user to analyze a MongoDB query and view its execution statistics.

The application should help users understand how MongoDB executes a query by displaying information such as:

- Query execution time.
- Number of documents examined.
- Number of documents returned.
- Number of index keys examined.
- Whether MongoDB used a collection scan or an index scan.

The application should obtain these statistics using MongoDB's built-in `explain("executionStats")` functionality.

The application should not attempt to optimize queries automatically. Its only responsibility is to execute a safe, predefined type of query analysis and display the results clearly.

### Keep the Scope Small

This is a learning project, not a production-ready database monitoring platform.

Build only the minimum features required for a working V1.

Do not add AI, machine learning, automatic query optimization, recommendations, authentication, or advanced monitoring.

---

## 3. Technology Stack

Use the following technologies:

### Backend
- Node.js
- Express.js
- JavaScript
- Official MongoDB Node.js Driver

### Database
- MongoDB
- A database named `query_analyzer`
- A collection named `users`

### Frontend
- ReactJS + MUI

### Development Tools
- npm
- Nodemon for automatic server restarts during development
- MongoDB Compass as an optional tool for inspecting database records
- Postman or curl for testing the backend API

### Important Restrictions

1. Use JavaScript, not TypeScript.
2. Use the official MongoDB Node.js Driver, not Mongoose.
3. Use plain HTML, CSS, and JavaScript instead of React.
4. Do not introduce Redis, Kafka, Docker, Kubernetes, cloud services, or microservices.
5. Do not use an AI API or any external AI service.
6. Do not add unnecessary npm packages.
7. Use environment variables for the MongoDB connection string and server port.
8. Keep the code readable and beginner-friendly.

---

## 4. Features Required in V1

Implement only the following features.

### Feature 1: Analyze a MongoDB Query

The frontend should allow the user to:

- Enter a supported MongoDB filter in JSON format.
- Select or use the predefined `users` collection.
- Click an Analyze button.
- Send the filter to the backend.
- Receive the execution statistics.
- View the results on the page.

For example, the user might enter:

```json
{
  "age": {
    "$gt": 25
  }
}
```

The backend should execute the equivalent of:

```javascript
db.collection("users")
  .find(filter)
  .explain("executionStats");
```

Use the official MongoDB Node.js Driver syntax.

The frontend should accept a JSON filter, not an arbitrary JavaScript expression or raw MongoDB shell command.

For V1, support only read-only `find()` queries using a JSON filter against the predefined `users` collection.

### Feature 2: Display Execution Statistics

Display the following information returned by MongoDB:

1. Execution time in milliseconds.
2. Total documents examined.
3. Total documents returned.
4. Total index keys examined.
5. Execution plan stage.

The interface should show these statistics in clearly labeled cards or sections.

Also display the submitted filter in a readable format.

### Feature 3: Display the Execution Plan

Display whether the query execution plan contains:

- `COLLSCAN`: MongoDB performed a collection scan.
- `IXSCAN`: MongoDB performed an index scan.

Inspect the winning execution plan recursively because MongoDB plans can contain nested stages.

If the plan contains multiple relevant stages, display the distinct stages found rather than assuming that every query has exactly one stage.

Do not present `COLLSCAN` as automatically incorrect or `IXSCAN` as automatically optimal. This project should report what MongoDB did, not judge whether the query is good or bad.

### Feature 4: Basic Error Handling

Handle these cases:

- Invalid JSON input.
- Empty filter input.
- MongoDB connection failures.
- Invalid query filters.
- Missing or unexpected execution statistics.
- Unexpected server errors.

Display simple, understandable error messages in the frontend.

Never expose database credentials, environment variables, stack traces, or other sensitive server information to the browser.

---

## 5. Explicitly Excluded Features

Do not implement any of the following in V1:

- AI-powered analysis.
- AI recommendations or suggestions.
- Automatic index recommendations.
- Automatic index creation.
- Automatic query rewriting.
- Natural-language query generation.
- Query history.
- User registration or login.
- Role-based access control.
- Saved reports.
- Query comparison.
- Benchmarking multiple queries.
- Aggregation pipeline analysis.
- Index management tools.
- Database administration features.
- Multiple user-configurable databases.
- Charts or advanced visualizations.
- Redis caching.
- Prometheus or Grafana.
- Docker or Kubernetes.
- Cloud deployment.

Do not add features simply because they might be useful in a future version.

The objective is to complete a small, understandable, working V1.

---

## 6. Application Architecture

Use a simple client-server architecture.

```text
User
 |
 v
Frontend
(ReactJS + MUI)
 |
 | POST /api/analyze
 | JSON filter
 v
Express Backend
 |
 | Validate request
 | Execute find().explain("executionStats")
 v
MongoDB
 |
 | Return execution statistics
 v
Express Backend
 |
 | Extract required metrics
 | Return JSON response
 v
Frontend
 |
 v
Display execution statistics
```

### Responsibilities of Each Component

**Frontend**

- Collect the JSON filter.
- Validate that the input contains valid JSON.
- Send the filter to the backend.
- Display loading, success, and error states.
- Render the returned execution statistics.

**Backend**

- Accept the API request.
- Validate the request body.
- Ensure the filter is a valid JSON object and not an array or primitive.
- Execute a read-only query analysis.
- Extract the relevant metrics and execution stages.
- Return a structured JSON response.
- Handle errors safely.

**MongoDB**

- Store the sample users.
- Execute the query plan.
- Provide execution statistics through `explain("executionStats")`.

Keep the backend as a single Express application. Separate files only where doing so improves clarity.

---

## 7. Suggested Project Structure

Use the following folder structure:

```text
Analyzer/
│
├── src/
│   ├── config/
│   │   └── db.js
│   │
│   ├── routes/
│   │   └── analyze.routes.js
│   │
│   ├── controllers/
│   │   └── analyze.controller.js
│   │
│   ├── services/
│   │   └── analyze.service.js
│   │
│   ├── utils/
│   │   └── extractStages.js
│   │
│   └── server.js
│
├── public/
│
├── scripts/
│   └── seed.js
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

Explain the purpose of every file before implementing it.

Keep the responsibilities simple:

- `db.js`: Connect to MongoDB and provide access to the database.
- `analyze.routes.js`: Define the analysis endpoint.
- `analyze.controller.js`: Validate the request and send the response.
- `analyze.service.js`: Run `find().explain("executionStats")` and extract metrics.
- `extractStages.js`: Traverse the execution plan and collect relevant stages.
- `server.js`: Configure Express, serve static files, register routes, and start the server.
- `index.html`: Define the interface.
- `style.css`: Style the interface.
- `script.js`: Handle user interaction and display results.
- `seed.js`: Insert sample users into MongoDB.

Do not introduce classes, dependency injection, repositories, or other architectural patterns unless absolutely necessary.

---

## 8. API Design

Implement only one application API endpoint.

### POST /api/analyze

**Purpose:** Analyze a supported MongoDB `find()` filter against the `users` collection.

Request body:

```json
{
  "filter": {
    "age": {
      "$gt": 25
    }
  }
}
```

Example response:

```json
{
  "success": true,
  "data": {
    "filter": {
      "age": {
        "$gt": 25
      }
    },
    "executionTimeMs": 12,
    "documentsExamined": 5000,
    "documentsReturned": 100,
    "keysExamined": 0,
    "executionStages": [
      "COLLSCAN"
    ]
  }
}
```

The values above are illustrative only. Actual values must come from the current MongoDB execution result.

### API Requirements

- Use HTTP status codes appropriately.
- Return a consistent JSON response structure.
- Use HTTP 400 for invalid requests.
- Use HTTP 500 for unexpected server-side errors.
- Do not return fabricated statistics.
- Do not return the entire MongoDB explain document unless needed for debugging.
- Extract only the fields required by the frontend.
- Account for the fact that MongoDB execution plans can differ depending on server version, query, and available indexes.
- If a metric or plan stage cannot be extracted, handle it explicitly rather than silently reporting an incorrect value.

---

## 9. Database Setup

Create a MongoDB database named:

`query_analyzer`

Create a collection named:

`users`

Use a simple sample dataset containing fields such as:

```json
{
  "name": "Alice",
  "age": 28,
  "city": "Delhi",
  "role": "developer"
}
```

Add enough sample documents to make the analyzer interesting to test. Approximately 100–1,000 sample documents are sufficient for this learning project.

Use a seed script so that the data can be created consistently.

Do not generate fake performance statistics. The analyzer must use the real output from MongoDB.

Initially, do not create a custom index on `age`. Later, for testing only, create an index manually and compare the resulting execution plans. This is a testing procedure, not an index-management feature in the application.

Explain that a small collection may produce different results from a large production database, and that MongoDB's query planner may choose a collection scan even when an index exists.

---

## 10. Implementation Phases

Build the application in the following order.

### Phase 1 — Project Setup

Tasks:

1. Explain the overall project in simple language.
2. Explain what a MongoDB Query Analyzer does.
3. Create the project directory.
4. Initialize npm.
5. Install the minimum required dependencies.
6. Configure the development script.
7. Create `.env` and `.env.example`.
8. Create `.gitignore`.
9. Connect the application to MongoDB.
10. Verify the connection with a simple test.

**Completion criteria:** The Node.js application connects successfully to MongoDB.

### Phase 2 — Sample Database

Tasks:

1. Create the `query_analyzer` database and `users` collection.
2. Write the seed script.
3. Insert sample documents.
4. Run the script.
5. Verify the documents in MongoDB.
6. Test a simple `find()` query.

**Completion criteria:** Sample data exists and can be queried.

### Phase 3 — Core Query Analysis

Tasks:

1. Explain what `explain()` does.
2. Explain the difference between `queryPlanner` and `executionStats`.
3. Explain the purpose of `find().explain("executionStats")`.
4. Implement the analysis service.
5. Execute a filter against MongoDB.
6. Extract the required statistics.
7. Extract execution stages safely, including nested stages.
8. Test the service with multiple filters.

**Completion criteria:** The backend can produce real execution statistics without a frontend.

### Phase 4 — Express API

Tasks:

1. Create the Express server.
2. Implement `POST /api/analyze`.
3. Validate the request body.
4. Connect the controller to the analysis service.
5. Return a structured JSON response.
6. Handle errors appropriately.
7. Test successful and unsuccessful requests with Postman or curl.

**Completion criteria:** The endpoint accepts a supported filter and returns actual MongoDB statistics.

### Phase 5 — Frontend

Tasks:

Create the frontend using ReactJS and MUI

**Completion criteria:** A user can analyze a query and see its statistics in a browser.

### Phase 6 — End-to-End Testing

Test the following scenarios:

1. An empty filter `{}`.
2. A filter that matches several documents.
3. A filter that matches no documents.
4. An invalid JSON filter.
5. A filter using an unsupported or invalid query operator.
6. A query executed when an index is absent.
7. The same query after manually creating an appropriate index.
8. A temporary database connection failure.

Verify that the application reports the actual execution results.

For the index experiment, compare the observed execution stages and statistics. Do not guarantee that adding an index will always change the plan or improve performance.

**Completion criteria:** The application works for valid requests and handles expected errors correctly.

### Phase 7 — Documentation

Create a simple README containing:

- Project overview.
- Features.
- Technology stack.
- Prerequisites.
- Installation instructions.
- Environment variable setup.
- Database seeding instructions.
- How to start the application.
- API request example.
- Example output.
- Explanation of the execution statistics.
- Current limitations.

**Completion criteria:** Someone can clone the project, configure MongoDB, and run the application by following the README.

---

## 11. Important MongoDB Concepts to Teach Me

While implementing the application, explain these concepts in simple language:

1. What a MongoDB query is.
2. What a filter object is.
3. What an index is.
4. What `COLLSCAN` means.
5. What `IXSCAN` means.
6. What `explain()` does.
7. What `executionStats` contains.
8. What `executionTimeMillis` means.
9. What `totalDocsExamined` means.
10. What `totalKeysExamined` means.
11. What `nReturned` means.
12. How to inspect nested execution stages.
13. Why examined documents and returned documents can differ.
14. Why an index does not guarantee a faster query.
15. Why execution time can vary between runs.

Explain each concept when it becomes relevant to the implementation. Do not explain all of them in a single information-heavy response.

---

## 12. Security and Correctness Requirements

Although this is a learning prototype, follow a few important rules.

- Never accept or execute arbitrary JavaScript supplied by the user.
- Accept JSON filter objects only.
- Restrict the application to the predefined `users` collection.
- Do not expose arbitrary database selection or collection selection.
- Use a read-only database account where practical.
- Use environment variables for database credentials.
- Do not commit `.env` to Git.
- Limit request body size.
- Reject malformed input and unsupported query structures.
- Do not allow writes, deletes, or updates through the analyzer.
- Avoid unbounded result fetching; use `explain()` to obtain execution statistics instead of retrieving all matching documents.
- Add a reasonable request timeout or other basic protection against excessively expensive queries where practical.
- Do not expose stack traces or sensitive connection details to the client.

Do not overengineer the security layer. Implement the basic protections clearly and explain their purpose.

---

## 13. Teaching and Coding Rules

Follow these instructions throughout the project.

### Rule 1: Work One Phase at a Time

Start with Phase 1 only.

Do not implement all phases in one response.

After completing a phase, summarize what we built and how to verify it. Then ask me whether I want to proceed to the next phase.

### Rule 2: Explain Before Coding

Before writing code for a component, explain:

- What the component does.
- Why we need it.
- How it fits into the application.
- What input it receives.
- What output it produces.

Then provide the code.

### Rule 3: Provide Complete, Usable Code

Whenever a file is required:

- Mention its exact path.
- Provide its complete contents.
- Explain the important lines.
- Include the commands needed to run or test it.

Do not provide disconnected snippets that require me to guess where they belong.

If an existing file must change, provide the complete updated file.

### Rule 4: Explain the Logic in Simple Language

Assume I am still developing my coding and logic-building skills.

Use simple language and real-world analogies when helpful.

For example, explain a collection scan as checking every record in a filing cabinet instead of looking up a record through an index.

Introduce technical terminology after explaining the basic idea.

### Rule 5: Keep the Implementation Minimal

Prefer straightforward code over clever code.

Do not add unnecessary dependencies, abstractions, or features.

Do not refactor working code without a clear reason.

### Rule 6: Test Each Component

After implementing a component, provide the exact command or request needed to test it.

Explain the expected output and how to interpret errors.

Do not assume that a component works merely because the code has been written.

### Rule 7: Debug Incrementally

If I encounter an error:

1. Ask for the relevant error message and code if necessary.
2. Identify the likely cause.
3. Explain the cause in simple language.
4. Provide the smallest appropriate fix.
5. Explain how to verify that the fix worked.

Do not restart the entire project when only one component needs fixing.

### Rule 8: Avoid Scope Creep

Do not introduce AI, recommendations, query optimization, advanced visualizations, Docker, Kubernetes, deployment, or other excluded features.

Keep the project focused on the basic query analysis workflow.

---

## 14. Definition of Done

Version 1 is complete when:

- The backend connects to MongoDB.
- The sample database can be seeded.
- The frontend accepts a JSON filter.
- The backend validates the filter.
- MongoDB analyzes the query using `explain("executionStats")`.
- The application displays execution time, documents examined, documents returned, index keys examined, and execution stages.
- The frontend displays errors for invalid requests.
- The application can be tested end to end.
- The README explains how to run the project.

There must be no AI, automatic recommendations, or automatic optimization.

## 15. Start Here

Begin with **Phase 1 — Project Setup**.

First, give me a short overview of what we are about to build. Then explain the project structure and the first setup steps.

Provide the exact terminal commands and complete code for the first required files.

Do not move to Phase 2 until I confirm that Phase 1 works.

Remember: the goal is not to build an impressive-looking complex system. The goal is to build a small, functional MongoDB Query Analyzer that I understand from the ground up.