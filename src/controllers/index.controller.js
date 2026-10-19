const { listIndexes, createIndex, dropIndex } = require("../services/index.service");

// Directions MongoDB accepts for a basic index key.
// "text" and "hashed" are valid but unusual — allowed so the API
// stays honest about what MongoDB supports.
const ALLOWED_DIRECTIONS = [1, -1, "text", "hashed"];

// Keep V1 basic: one field per index only.
const MAX_KEY_FIELDS = 1;

/**
 * Validates the create-index body.
 * Returns an error message string, or null if the input is valid.
 */
function validateCreateInput(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Request body must be a JSON object.";
  }

  const { key, name } = body;

  if (!key || typeof key !== "object" || Array.isArray(key)) {
    return '"key" must be a JSON object, for example { "age": 1 }.';
  }

  const fields = Object.keys(key);

  if (fields.length === 0) {
    return '"key" must contain at least one field.';
  }

  if (fields.length > MAX_KEY_FIELDS) {
    return 'Only single-field indexes are supported, for example { "age": 1 }.';
  }

  const field = fields[0];
  const direction = key[field];

  if (field.length === 0 || field.length > 64 || field.startsWith("$")) {
    return "Index field names must be 1-64 characters and cannot start with $.";
  }

  if (!ALLOWED_DIRECTIONS.includes(direction)) {
    return 'Index direction must be 1, -1, "text", or "hashed".';
  }

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length === 0 || name.length > 64) {
      return '"name" must be a non-empty string of at most 64 characters.';
    }
  }

  return null;
}

/**
 * Validates the index name in the URL for a drop request.
 */
function validateDropName(name) {
  if (!name || typeof name !== "string" || name.length === 0) {
    return "Index name is required.";
  }

  if (name === "_id_") {
    return 'The default "_id_" index cannot be dropped.';
  }

  if (name.length > 64) {
    return "Index name is too long.";
  }

  return null;
}

/**
 * GET /api/indexes
 */
async function handleListIndexes(req, res, next) {
  try {
    const indexes = await listIndexes();
    res.status(200).json({ success: true, data: indexes });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/indexes
 */
async function handleCreateIndex(req, res, next) {
  try {
    const validationError = validateCreateInput(req.body);

    if (validationError) {
      return res.status(400).json({ success: false, error: validationError });
    }

    const { key, name } = req.body;
    const data = await createIndex(key, name);

    res.status(201).json({ success: true, data });
  } catch (error) {
    // MongoDB rejects duplicate/conflicting index definitions — those are
    // client mistakes, so report them as 400 with the message only.
    if (error.name === "MongoServerError" || error.name === "MongoParseError") {
      return res.status(400).json({
        success: false,
        error: "MongoDB rejected this index: " + error.message,
      });
    }

    next(error);
  }
}

/**
 * DELETE /api/indexes/:name
 */
async function handleDropIndex(req, res, next) {
  try {
    const validationError = validateDropName(req.params.name);

    if (validationError) {
      return res.status(400).json({ success: false, error: validationError });
    }

    const data = await dropIndex(req.params.name);

    res.status(200).json({ success: true, data });
  } catch (error) {
    if (error.name === "MongoServerError") {
      return res.status(400).json({
        success: false,
        error: "MongoDB rejected this request: " + error.message,
      });
    }

    next(error);
  }
}

module.exports = { handleListIndexes, handleCreateIndex, handleDropIndex };
