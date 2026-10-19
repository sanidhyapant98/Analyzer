const { getDb } = require("../config/db");

const COLLECTION_NAME = "users";

/**
 * Lists all indexes on the users collection.
 * Returns only name + key so the frontend never sees internal plan details.
 */
async function listIndexes() {
  const users = getDb().collection(COLLECTION_NAME);
  const indexes = await users.listIndexes().toArray();

  return indexes.map((index) => ({
    name: index.name,
    key: index.key,
  }));
}

/**
 * Creates a single index on the users collection.
 *
 * @param {Object} key - e.g. { age: 1 }
 * @param {string} [name] - optional custom index name
 * @returns {Object} the index name MongoDB assigned plus the key used
 */
async function createIndex(key, name) {
  const users = getDb().collection(COLLECTION_NAME);
  const options = name ? { name } : {};

  // createIndex is idempotent: creating the same index twice just
  // returns the existing name instead of failing.
  const indexName = await users.createIndex(key, options);

  return { name: indexName, key };
}

/**
 * Drops a single index by name.
 * MongoDB throws if the index does not exist — the controller maps
 * that to a client error.
 */
async function dropIndex(name) {
  const users = getDb().collection(COLLECTION_NAME);
  await users.dropIndex(name);

  return { dropped: name };
}

module.exports = { listIndexes, createIndex, dropIndex };
