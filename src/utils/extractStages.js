// Stages worth reporting to the user. MongoDB has many stage types
// (SORT, LIMIT, PROJECTION, FETCH, etc.) but for V1 we care most
// about how the documents were *found*: collection scan vs index scan.
const INTERESTING_STAGES = ["COLLSCAN", "IXSCAN"];

/**
 * Recursively walks a MongoDB execution plan tree and collects
 * the distinct "interesting" stage names found anywhere inside it.
 *
 * MongoDB plans are nested. Example shape:
 *   LIMIT
 *     └── PROJECTION
 *           └── FETCH
 *                 └── IXSCAN
 *
 * Each node has a `stage` field and often a nested `inputStage`
 * (or, for some stages, `inputStages` — an array).
 */
function extractStages(stageNode) {
  const found = new Set();

  function walk(node) {
    if (!node || typeof node !== "object") return;

    if (node.stage && INTERESTING_STAGES.includes(node.stage)) {
      found.add(node.stage);
    }

    // Most stages have a single child...
    if (node.inputStage) {
      walk(node.inputStage);
    }

    // ...but some (like UNION_HASHED or multi-phase plans) have several.
    if (Array.isArray(node.inputStages)) {
      node.inputStages.forEach(walk);
    }

    // Some nested plans appear under executionStages of a child.
    if (node.innerStage) walk(node.innerStage);
    if (node.outerStage) walk(node.outerStage);
    if (node.shards) {
      node.shards.forEach((shard) => walk(shard.executionStage));
    }
  }

  walk(stageNode);

  // If we found nothing recognizable, return an empty array —
  // the caller must handle this explicitly, never silently.
  return Array.from(found);
}

module.exports = { extractStages };
