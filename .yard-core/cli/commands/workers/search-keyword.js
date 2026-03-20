/**
 * cli/commands/workers/search-keyword.js
 * Fuzzy-matching search system for workers in a registry.
 * Serves as a fallback when semantic search is unavailable.
 *
 * Performance: Multiple optimization strategies to minimize Levenshtein calls.
 * Search fields: ID (1.5x), name (1.3x), description (0.8x)
 * Threshold: minimum 20, maximum 100 (result cap)
 *
 * @version 1.0.0
 */

'use strict';

const MIN_SCORE = 20;
const MAX_RESULTS = 100;

/**
 * Calculates edit distance between two strings using dynamic programming.
 *
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function levenshteinDistance(a, b) {
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const dp = [];
  for (let i = 0; i <= m; i++) {
    dp[i] = [i];
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Generates a match score (0-100) for a query against a target string.
 * Uses multiple optimizations to avoid expensive Levenshtein when possible.
 *
 * @param {string} query - Lowercased query
 * @param {string} target - Lowercased target
 * @returns {number} Score 0-100
 */
function fuzzyMatchScore(query, target) {
  if (!query || !target) return 0;

  // Exact match
  if (query === target) return 100;

  // Exact containment (fast path)
  if (target.includes(query)) {
    // Higher score if at start
    return target.startsWith(query) ? 90 : 80;
  }

  // Reverse containment: query contains target (e.g. query='json transformer', target='json')
  if (query.includes(target)) {
    return query.startsWith(target) ? 90 : 85;
  }

  // Per-word fast path: check individual query words
  const queryWords = query.split(/\s+/).filter(Boolean);
  let wordMatchScore = 0;
  for (const word of queryWords) {
    if (target.includes(word)) {
      wordMatchScore += 60 / queryWords.length;
    }
  }
  if (wordMatchScore >= 60) return Math.round(wordMatchScore);

  // Levenshtein — only for short words with manageable length diff
  let levenScore = 0;
  for (const word of queryWords) {
    if (word.length > 8) continue; // Skip long words

    const targetWords = target.split(/\s+/);
    for (const tw of targetWords) {
      if (Math.abs(tw.length - word.length) > 3) continue; // Length filter

      const dist = levenshteinDistance(word, tw);
      const maxLen = Math.max(word.length, tw.length);
      const similarity = (1 - dist / maxLen) * 70;
      if (similarity > levenScore) levenScore = similarity;
    }
  }

  if (levenScore > 0) return Math.round(levenScore);

  return 0;
}

/**
 * Main search function. Returns workers ranked by relevance.
 *
 * Field weights:
 *   ID          1.5x
 *   Name        1.3x
 *   Description 0.8x
 *
 * @param {Object[]} workers - Worker registry array
 * @param {string} query - Search query
 * @returns {Array<{ worker: Object, score: number, matchType: string }>}
 */
function searchKeyword(workers, query) {
  if (!query || !workers || workers.length === 0) return [];

  const q = query.toLowerCase().trim();
  const results = [];

  for (const worker of workers) {
    const id = (worker.id || '').toLowerCase();
    const name = (worker.name || '').toLowerCase();
    const description = (worker.description || '').toLowerCase();
    const tags = Array.isArray(worker.tags) ? worker.tags.map((t) => t.toLowerCase()) : [];

    // Early exit: exact ID match
    if (id === q) {
      results.push({ worker, score: 100, matchType: 'exact_id' });
      continue;
    }

    // Fast path: tag exact match
    if (tags.includes(q)) {
      results.push({ worker, score: 95, matchType: 'exact_tag' });
      continue;
    }

    // Weighted scoring
    const idScore = fuzzyMatchScore(q, id) * 1.5;
    const nameScore = fuzzyMatchScore(q, name) * 1.3;
    const descScore = fuzzyMatchScore(q, description) * 0.8;

    const finalScore = Math.min(100, Math.round(Math.max(idScore, nameScore, descScore)));

    if (finalScore >= MIN_SCORE) {
      const matchType = idScore >= nameScore && idScore >= descScore
        ? 'id'
        : nameScore >= descScore ? 'name' : 'description';
      results.push({ worker, score: finalScore, matchType });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, MAX_RESULTS);
}

/**
 * Performs exact tag matching across the registry.
 *
 * @param {Object[]} workers
 * @param {string} tag
 * @returns {Object[]} Matched workers
 */
function searchByTags(workers, tag) {
  if (!tag || !workers) return [];
  const t = tag.toLowerCase();
  return workers.filter((w) => {
    const tags = Array.isArray(w.tags) ? w.tags.map((x) => x.toLowerCase()) : [];
    return tags.includes(t);
  });
}

/**
 * Registry-aware search: loads workers from registry then searches.
 * Accepts (query) as single arg or (workers, query) as two args.
 * Returns flattened results with { ...worker, score, matchType }.
 *
 * @param {string|Object[]} queryOrWorkers
 * @param {string} [query]
 * @returns {Promise<Array>|Array}
 */
async function searchKeywordFromRegistry(query) {
  const { getRegistry } = require('../../../core/registry/registry-loader');
  const registry = getRegistry();
  await registry.load();
  const workers = await registry.getAll();
  return searchKeyword(workers, query).map(r => ({
    ...r.worker,
    score: r.score,
    matchType: r.matchType,
  }));
}

module.exports = {
  levenshteinDistance,
  fuzzyMatchScore,
  searchKeyword: searchKeywordFromRegistry,
  searchKeywordRaw: searchKeyword,
  searchByTags,
};
