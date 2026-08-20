/**
 * Search Relevance Scoring Engine
 *
 * Professional search scoring that handles exact, prefix, word-start,
 * contains and fuzzy matches across the product fields that matter to a
 * marketplace. The scorer is deliberately independent from Prisma so it can
 * be unit-tested and replaced by a dedicated search index later.
 */

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  if (a.length > b.length) return levenshtein(b, a);

  const prevRow = Array.from({ length: a.length + 1 }, (_, i) => i);
  const currRow = new Array<number>(a.length + 1);
  for (let j = 1; j <= b.length; j++) {
    currRow[0] = j;
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[i - 1] ? 0 : 1;
      currRow[i] = Math.min(prevRow[i] + 1, currRow[i - 1] + 1, prevRow[i - 1] + cost);
    }
    prevRow.splice(0, prevRow.length, ...currRow);
  }
  return prevRow[a.length];
}

export function normalizePersian(s: string): string {
  return s
    .replace(/[\u200C\u200D]/g, '')
    .replace(/\u064A/g, '\u06CC')
    .replace(/\u0643/g, '\u06A9')
    .replace(/\u0629/g, '\u0647')
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
    .replace(/\u0624/g, '\u0648')
    .replace(/\u0626/g, '\u06CC')
    .replace(/\u0640/g, '')
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeText(s: string): string {
  return normalizePersian(s).toLowerCase().trim().replace(/[،,؛;:.!\-_«»]/g, ' ').replace(/\s+/g, ' ').trim();
}

export interface SearchFieldWeights {
  name: number;
  shortDescription: number;
  description: number;
  categoryName: number;
  tags: number;
  region: number;
  sellerShopName: number;
  brand: number;
}

export const DEFAULT_FIELD_WEIGHTS: SearchFieldWeights = {
  name: 10,
  shortDescription: 4,
  description: 2,
  categoryName: 3,
  tags: 3,
  region: 1.5,
  sellerShopName: 1.5,
  brand: 5,
};

export interface MatchTypeScores {
  exact: number;
  startsWith: number;
  wordStart: number;
  contains: number;
  fuzzy1: number;
  fuzzy2: number;
  noMatch: number;
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

export function scoreField(fieldValue: string | null | undefined, query: string, matchScores: MatchTypeScores = DEFAULT_MATCH_SCORES): number {
  if (!fieldValue || !query) return 0;
  const norm = normalizeText(fieldValue);
  const q = normalizeText(query);
  if (!norm || !q) return 0;
  if (norm === q) return matchScores.exact;
  if (norm.startsWith(q)) return matchScores.startsWith;
  const words = norm.split(' ');
  if (words.some((w) => w.startsWith(q))) return matchScores.wordStart;
  if (norm.includes(q)) return matchScores.contains;

  if (q.length >= 3 && norm.length >= q.length - 2) {
    for (const word of words) {
      if (Math.abs(word.length - q.length) <= 2) {
        const dist = levenshtein(word, q);
        if (dist === 1) return matchScores.fuzzy1;
        if (dist === 2 && q.length >= 5) return matchScores.fuzzy2;
      }
    }
    if (Math.abs(norm.length - q.length) <= 2) {
      const dist = levenshtein(norm, q);
      if (dist === 1) return matchScores.fuzzy1;
      if (dist === 2 && q.length >= 5) return matchScores.fuzzy2;
    }
  }
  return matchScores.noMatch;
}

export interface SearchableProduct {
  id: string;
  name: string;
  shortDescription?: string | null;
  description?: string | null;
  categoryName?: string | null;
  tags?: string[] | null;
  region?: string | null;
  sellerShopName?: string | null;
  brand?: string | null;
}

export function computeSearchScore(product: SearchableProduct, query: string, fieldWeights: SearchFieldWeights = DEFAULT_FIELD_WEIGHTS, matchScores: MatchTypeScores = DEFAULT_MATCH_SCORES): number {
  const queries = query.trim().split(/\s+/).filter(Boolean);
  if (queries.length === 0) return 0;
  let total = 0;
  for (const q of queries) {
    const fieldScores = [
      scoreField(product.name, q, matchScores) * fieldWeights.name,
      scoreField(product.shortDescription, q, matchScores) * fieldWeights.shortDescription,
      scoreField(product.description, q, matchScores) * fieldWeights.description,
      scoreField(product.categoryName, q, matchScores) * fieldWeights.categoryName,
      scoreField(product.region, q, matchScores) * fieldWeights.region,
      scoreField(product.sellerShopName, q, matchScores) * fieldWeights.sellerShopName,
      scoreField(product.brand, q, matchScores) * fieldWeights.brand,
      ...(product.tags ?? []).map((tag) => scoreField(tag, q, matchScores) * fieldWeights.tags),
    ];
    const best = Math.max(...fieldScores);
    if (best === 0) return 0;
    total += best;
  }
  return total;
}

export interface SearchSuggestion {
  text: string;
  type: 'product' | 'category' | 'brand';
  score: number;
}

export function generateSuggestions(candidates: Array<{ text: string; type: SearchSuggestion['type'] }>, partialQuery: string, limit = 10): SearchSuggestion[] {
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

import type { Prisma } from '@prisma/client';

/** Build a DB-side recall filter while preserving normalized Persian/Arabic variants. */
export function buildSearchWhereClause(query: string): Prisma.ProductWhereInput {
  const original = query.trim();
  if (!original) return {};

  const normalized = normalizeText(original);
  const originalTokens = original.split(/\s+/).filter(Boolean);
  const normalizedTokens = normalized.split(/\s+/).filter(Boolean);

  if (originalTokens.length === 1) {
    const variants = [...new Set([originalTokens[0], normalizedTokens[0]].filter(Boolean))];
    return {
      OR: variants.flatMap((variant) => [
        { name: { contains: variant, mode: 'insensitive' as const } },
        { shortDescription: { contains: variant, mode: 'insensitive' as const } },
        { description: { contains: variant, mode: 'insensitive' as const } },
        { region: { contains: variant, mode: 'insensitive' as const } },
        { category: { name: { contains: variant, mode: 'insensitive' as const } } },
        { seller: { sellerShopName: { contains: variant, mode: 'insensitive' as const } } },
      ]),
    };
  }

  return {
    AND: originalTokens.map((originalToken, index) => {
      const variants = [...new Set([originalToken, normalizedTokens[index]].filter(Boolean))];
      return {
        OR: variants.flatMap((variant) => [
          { name: { contains: variant, mode: 'insensitive' as const } },
          { shortDescription: { contains: variant, mode: 'insensitive' as const } },
          { description: { contains: variant, mode: 'insensitive' as const } },
          { region: { contains: variant, mode: 'insensitive' as const } },
          { category: { name: { contains: variant, mode: 'insensitive' as const } } },
          { seller: { sellerShopName: { contains: variant, mode: 'insensitive' as const } } },
        ]),
      };
    }),
  };
}
