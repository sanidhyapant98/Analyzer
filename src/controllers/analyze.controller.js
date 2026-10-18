const { analyzeQuery } = require("../services/analyze.service");

/**
 * Recursively checks a filter for the $where operator.
 * $where executes arbitrary JavaScript on the database server,
 * which violates our "JSON filters only, no code execution" rule.
 */
function containsWhereOperator(value) {
  if (value === null || typeof value !== "object") return false;

  for (const key of Object.keys(value)) {
    if (key === "$where") return true;
    if (containsWhereOperator(value[key])) return true;
  }
  return false;
}

/**
 * Validates the incoming request body.
 * Returns an error message string, or null if the input is valid.
 */
function validateAnalyzeInput(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Request body must be a JSON object.";
  }

  if (!("filter" in body)) {
    return 'Missing required field "filter".';
  }

  const filter = body.filter;

  if (filter === null || typeof filter !== "object" || Array.isArray(filter)) {
    return '"filter" must be a JSON object, for example { "age": { "$gt": 25 } }.';
  }

  if (containsWhereOperator(filter)) {
    return 'The "$where" operator is not allowed.';
  }

  return null;
}

/**
 * POST /api/analyze
 */
async function handleAnalyze(req, res, next) {
  try {
    const validationError = validateAnalyzeInput(req.body);

    if (validationError) {
      // 400 = client sent something invalid
      return res.status(400).json({ success: false, error: validationError });
    }

    const { filter } = req.body;
    const data = await analyzeQuery(filter);

    res.status(200).json({ success: true, data });
  } catch (error) {
    // MongoDB throws for invalid operators/filters (e.g. unknown $op).
    // Those are client mistakes, so report them as 400 — but only the
    // message, never the stack trace or connection details.
    if (error.name === "MongoServerError" || error.name === "MongoParseError") {
      return res.status(400).json({
        success: false,
        error: "MongoDB rejected this filter: " + error.message,
      });
    }

    // Anything else is unexpected — pass to global error handler.
    next(error);
  }
}

module.exports = { handleAnalyze };
