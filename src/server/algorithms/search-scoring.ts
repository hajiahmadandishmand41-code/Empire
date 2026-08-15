/**
 * Search Relevance Scoring Engine
 *
 * Professional search scoring that handles:
 *   1. Exact match (highest score)
 *   2. Prefix match (high score)
 *   3. Contains match (medium score)
 *   4. Fuzzy / typo-tolerant match (low score, edit distance based)
 *   5. Multi-field scoring with field-level weight configuration
 *
 * The engine is designed so that adding new searchable fields
 * or adjusting weights does not require structural code changes.
 */

// ── Levenshtein distance ──────────────────────────────────────────────────────

/**
 * Compute the Levenshtein edit distance between two strings.
 * Uses the Wagner–Fischer algorithm with O(n) space optimization.
 *
 * Returns the number of single-character edits (insertions, deletions,
 * substitutions) required to change `a` into `b`.
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Use the shorter string as the column dimension to save memory.
  if (a.length > b.length) return levenshtein(b, a);

  const prevRow = Array.from({ length: a.length + 1 }, (_, i) => i);
  const currRow = new Array<number>(a.length + 1);

  for (let j = 1; j <= b.length; j++) {
    currRow[0] = j;
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currRow[i] = Math.min(
        prevRow[i] + 1,       // deletion
        currRow[i - 1] + 1,   // insertion
        prevRow[i - 1] + cost, // substitution
      );
    }
    prevRow.splice(0, prevRow.length, ...currRow);
  }

  return prevRow[a.length];
}

/**
 * Normalize a string for comparison:
 *   - Lowercase
 *   - Trim whitespace
 *   - Collapse multiple spaces
 *   - Remove common punctuation
 */
// ── Persian/Arabic character normalization ──────────────────────────────────────
/**
 * Normalize Persian/Arabic text for search comparison:
 *   - Converts Arabic characters to their Persian equivalents
 *   - Removes zero-width non-joiner (ZWNJ = نیم‌فاصله)
 *   - Removes other zero-width characters
 *   - Normalizes Arabic/Persian digits
 *   - Collapses spaces
 */
export function normalizePersian(s: string): string {
  return s
    // Remove zero-width non-joiner (ZWNJ U+200C) and zero-width joiner (ZWJ U+200D)
    .replace(/[\u200C\u200D]/g, "")
    // Arabic Ye -> Persian Ye
    .replace(/\u064A/g, "\u06CC")
    // Arabic Kaf -> Persian Kaf
    .replace(/\u0643/g, "\u06A9")
    // Arabic Ha (Tah marbuta) -> Persian Ha
    .replace(/\u0629/g, "\u0647")
    // Arabic Alef with hamza variations -> simple Alef
    .replace(/[\u0622\u0623\u0625\u0671]/g, "\u0627")
    // Arabic Waw with hamza -> Persian Waw
    .replace(/\u0624/g, "\u0648")
    // Arabic Ye with hamza -> Persian Ye
    .replace(/\u0626/g, "\u06CC")
    // Tatweel (kashida) - decorative extender
    .replace(/\u0640/g, "")
    // Arabic-Indic digits to Western digits
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    // Extended Arabic-Indic digits (Farsi) to Western digits
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
    // Collapse multiple spaces
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeText(s: string): string {
  return normalizePersian(s)
    .toLowerCase()
    .trim()
    .replace(/[،,؛;:.!\-_«»]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Field weight configuration ────────────────────────────────────────────────

/** Weights for different product fields when computing search relevance. */
export interface SearchFieldWeights {
  name: number;
  shortDescription: number;
  description: number;
  categoryName: number;
  tags: number;
  region: number;
  sellerShopName: number;
}

export const DEFAULT_FIELD_WEIGHTS: SearchFieldWeights = {
  name: 10.0,           // Name match is most important
  shortDescription: 4.0,
  description: 2.0,
  categoryName: 3.0,
  tags: 3.0,
  region: 1.5,
  sellerShopName: 1.5,
};

// ── Match type scores ─────────────────────────────────────────────────────────

export interface MatchTypeScores {
  exact: number;       // Entire field exactly matches the query
  startsWith: number;  // Field starts with the query (prefix match)
  wordStart: number;   // Any word in field starts with the query
  contains: number;    // Field contains the query as substring
  fuzzy1: number;      // Fuzzy match with edit distance 1
  fuzzy2: number;      // Fuzzy match with edit distance 2
  noMatch: number;     // No match
}

export const DEFAULT_MATCH_SCORES: MatchTypeScores = {
  exact: 100,
  startsWith: 70,
  wordStart: 50,
  contains: 30,
  fuzzy1: 15,
  fuzzy2: 7,
  noMatch: 0,
};

// ── Core scoring function ─────────────────────────────────────────────────────

/**
 * Score a single field value against the search query.
 * Returns a score in [0, ∞) based on the quality of the match.
 * Returns 0 if there is no match.
 */
export function scoreField(
  fieldValue: string | null | undefined,
  query: string,
  matchScores: MatchTypeScores = DEFAULT_MATCH_SCORES,
): number {
  if (!fieldValue || !query) return 0;

  const norm = normalizeText(fieldValue);
  const q = normalizeText(query);

  if (!norm || !q) return 0;

  // 1. Exact match
  if (norm === q) return matchScores.exact;

  // 2. Starts with query (prefix match)
  if (norm.startsWith(q)) return matchScores.startsWith;

  // 3. Any word starts with query
  const words = norm.split(' ');
  if (words.some((w) => w.startsWith(q))) return matchScores.wordStart;

  // 4. Contains query as substring
  if (norm.includes(q)) return matchScores.contains;

  // 5. Fuzzy match on the whole field (for short fields like name, category)
  // Only attempt fuzzy match if query is at least 3 chars to avoid noise.
  if (q.length >= 3 && norm.length >= q.length - 2) {
    // Try fuzzy on each word of the field (most useful for name/category)
    for (const word of words) {
      if (Math.abs(word.length - q.length) <= 2) {
        const dist = levenshtein(word, q);
        if (dist === 1) return matchScores.fuzzy1;
        if (dist === 2 && q.length >= 5) return matchScores.fuzzy2;
      }
    }

    // Try fuzzy on the full normalized field (useful for short category names)
    if (Math.abs(norm.length - q.length) <= 2) {
      const dist = levenshtein(norm, q);
      if (dist === 1) return matchScores.fuzzy1;
      if (dist === 2 && q.length >= 5) return matchScores.fuzzy2;
    }
  }

  return matchScores.noMatch;
}

// ── Composite product search scorer ──────────────────────────────────────────

export interface SearchableProduct {
  id: string;
  name: string;
  shortDescription?: string | null;
  description?: string | null;
  categoryName?: string | null;
  tags?: string[] | null;
  region?: string | null;
  sellerShopName?: string | null;
}

/**
 * Compute a composite search relevance score for a product given a query.
 * Returns 0 if no field matches, meaning the product should be excluded.
 *
 * The score is the weighted sum of per-field match scores.
 */
export function computeSearchScore(
  product: SearchableProduct,
  query: string,
  fieldWeights: SearchFieldWeights = DEFAULT_FIELD_WEIGHTS,
  matchScores: MatchTypeScores = DEFAULT_MATCH_SCORES,
): number {
  const queries = query.trim().split(/\s+/).filter(Boolean);
  if (queries.length === 0) return 0;

  // For multi-word queries, each word must match at least one field.
  // The total score is the sum of best per-word scores.
  let total = 0;
  for (const q of queries) {
    const fieldScores = [
      scoreField(product.name, q, matchScores) * fieldWeights.name,
      scoreField(product.shortDescription, q, matchScores) * fieldWeights.shortDescription,
      scoreField(product.description, q, matchScores) * fieldWeights.description,
      scoreField(product.categoryName, q, matchScores) * fieldWeights.categoryName,
      scoreField(product.region, q, matchScores) * fieldWeights.region,
      scoreField(product.sellerShopName, q, matchScores) * fieldWeights.sellerShopName,
      ...(product.tags ?? []).map(
        (tag) => scoreField(tag, q, matchScores) * fieldWeights.tags,
      ),
    ];

    const best = Math.max(...fieldScores);
    if (best === 0) return 0; // This word matched nothing → exclude product
    total += best;
  }

  return total;
}

// ── Suggestion generation ─────────────────────────────────────────────────────

export interface SearchSuggestion {
  text: string;
  type: 'product' | 'category' | 'brand';
  score: number;
}

/**
 * Generate autocomplete suggestions from a list of candidate strings.
 * Candidates are ranked by their match quality against the partial query.
 */
export function generateSuggestions(
  candidates: Array<{ text: string; type: SearchSuggestion['type'] }>,
  partialQuery: string,
  limit = 10,
): SearchSuggestion[] {
  const q = normalizeText(partialQuery);
  if (!q || q.length < 2) return [];

  const scored: SearchSuggestion[] = [];
  const seen = new Set<string>();

  for (const { text, type } of candidates) {
    const normText = normalizeText(text);
    if (seen.has(normText)) continue;

    const score = scoreField(text, partialQuery);
    if (score > 0) {
      scored.push({ text, type, score });
      seen.add(normText);
    }
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

// ── Prisma WHERE builder for text search ─────────────────────────────────────

import type { Prisma } from '@prisma/client';

/**
 * Build a Prisma WHERE clause for full-text search across product fields.
 *
 * This uses DB-side LIKE/ILIKE queries for initial filtering, then
 * the in-memory scorer above re-ranks the results for relevance.
 *
 * For production scale (millions of products), replace this with
 * a dedicated search index (PostgreSQL full-text search, Meilisearch,
 * Elasticsearch) without changing the service layer.
 */
export function buildSearchWhereClause(
  query: string,
): Prisma.ProductWhereInput {
  const qOrig = query;
  const q = query.trim();
  if (!q) return {};

  // Split into tokens to support multi-word queries at DB level.
  const tokens = q.split(/\s+/).filter(Boolean);

  if (tokens.length === 1) {
    // Single token — broad OR search across all fields.
    // Search with both normalized (Persian-fixed) and original query for maximum recall.
    const searchTerms = q !== qOrig ? [q, qOrig] : [q];
    const orClauses = searchTerms.flatMap((term) => [
      { name: { contains: term, mode: 'insensitive' as const } },
      { shortDescription: { contains: term, mode: 'insensitive' as const } },
      { description: { contains: term, mode: 'insensitive' as const } },
      { region: { contains: term, mode: 'insensitive' as const } },
      { category: { name: { contains: term, mode: 'insensitive' as const } } },
      { seller: { sellerShopName: { contains: term, mode: 'insensitive' as const } } },
    ]);
    return { OR: orClauses };
  }

  // Multi-token: each token must match at least one field (AND across tokens, OR across fields).
  return {
    AND: tokens.map((token) => ({
      OR: [
        { name: { contains: token, mode: 'insensitive' as const } },
        { shortDescription: { contains: token, mode: 'insensitive' as const } },
        { description: { contains: token, mode: 'insensitive' as const } },
        { region: { contains: token, mode: 'insensitive' as const } },
        { category: { name: { contains: token, mode: 'insensitive' as const } } },
      ],
    })),
  };
}
