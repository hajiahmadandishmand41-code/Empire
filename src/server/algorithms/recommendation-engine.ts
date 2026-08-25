import { computeProductScore, DEFAULT_RANKING_CONFIG, type RankingConfig, type ScoredProduct } from './product-ranking';

export type RecommendationContext = {
  query?: string;
  categoryKey?: string;
  recentProductIds?: string[];
  recentCategoryKeys?: string[];
  preferredProductIds?: string[];
  anonymous?: boolean;
};

export type RecommendationCandidate = ScoredProduct & { name?: string; shortDescription?: string | null; tags?: string[]; categoryKey?: string | null };
export type RecommendationWeights = RankingConfig & { relevance: number; categoryMatch: number; recentBehavior: number; personalization: number; similarity: number };
export const DEFAULT_RECOMMENDATION_WEIGHTS: RecommendationWeights = { ...DEFAULT_RANKING_CONFIG, relevance: 4, categoryMatch: 3, recentBehavior: 4, personalization: 3, similarity: 2 };

export function getRecommendationWeights(): RecommendationWeights {
  const raw = process.env.ESHOP_RECOMMENDATION_WEIGHTS?.trim();
  if (!raw) return DEFAULT_RECOMMENDATION_WEIGHTS;
  try { const parsed = JSON.parse(raw) as Partial<RecommendationWeights>; return { ...DEFAULT_RECOMMENDATION_WEIGHTS, ...parsed, weights: { ...DEFAULT_RECOMMENDATION_WEIGHTS.weights, ...(parsed.weights ?? {}) } }; } catch { return DEFAULT_RECOMMENDATION_WEIGHTS; }
}
function normalizedText(value: string | null | undefined): string[] { return (value ?? '').toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean); }
function overlapScore(a: string[], b: string[]): number { if (a.length === 0 || b.length === 0) return 0; const set = new Set(a); const hits = b.reduce((count, token) => count + (set.has(token) ? 1 : 0), 0); return Math.min(1, hits / Math.max(2, Math.min(8, b.length))); }

export function computeRecommendationScore(product: RecommendationCandidate, context: RecommendationContext, config: RecommendationWeights = getRecommendationWeights()): number {
  let score = computeProductScore(product, config);
  const queryTokens = normalizedText(context.query);
  const productTokens = [...normalizedText(product.name), ...normalizedText(product.shortDescription), ...(product.tags ?? []).flatMap(normalizedText)];
  if (queryTokens.length) score += overlapScore(productTokens, queryTokens) * config.relevance * 100;
  if (context.categoryKey && product.categoryKey === context.categoryKey) score += config.categoryMatch * 100;
  const recentPosition = product.id ? context.recentProductIds?.indexOf(product.id) ?? -1 : -1;
  if (recentPosition >= 0) score += Math.max(0, config.recentBehavior * (1 - recentPosition / 10) * 100);
  if (product.categoryKey && context.recentCategoryKeys?.includes(product.categoryKey)) score += config.recentBehavior * 0.6 * 100;
  if (product.id && context.preferredProductIds?.includes(product.id)) score += config.personalization * 100;
  if (context.anonymous) { score += (config.weights.salesCount ?? 0) * 4; score += (config.weights.viewCount ?? 0) * 2; }
  return score;
}

export function rankRecommendations<T extends RecommendationCandidate>(products: T[], context: RecommendationContext, config: RecommendationWeights = getRecommendationWeights()): T[] {
  return [...products]
    .map((product) => ({ product, score: computeRecommendationScore(product, context, config) }))
    .sort((a, b) => b.score - a.score || a.product.id.localeCompare(b.product.id))
    .map(({ product }) => product);
}
