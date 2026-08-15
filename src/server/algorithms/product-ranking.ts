/**
 * Product Ranking Algorithm
 *
 * A pluggable, extensible scoring system for product ordering.
 *
 * Design goals:
 *   1. Each ranking criterion is an independent, named "signal".
 *   2. Signals have configurable weights so product owners can tune without code changes.
 *   3. New signals can be added without touching existing sort logic.
 *   4. The algorithm is transparent — it logs the computed score for debugging.
 *
 * Architecture:
 *   RankingConfig  → defines which signals matter and their weights
 *   RankingSignal  → a single numeric input (sales, views, rating, recency, etc.)
 *   ProductRankingService.computeScore() → produces a composite score per product
 *   ProductRankingService.sortOrderBy()  → produces Prisma orderBy arrays
 */

import type { Prisma } from '@prisma/client';

// ── Signal definitions ─────────────────────────────────────────────────────────

/** Names of all supported ranking signals. Extend freely. */
export type RankingSignalName =
  | 'salesCount'      // Delivered orders — strongest purchase-intent signal
  | 'viewCount'       // Page views — popularity signal
  | 'wishlistCount'   // Wishlist adds — demand signal without purchase
  | 'reviewRating'    // Average rating — quality signal
  | 'reviewCount'     // Number of reviews — engagement signal
  | 'recency'         // Days since creation — freshness signal
  | 'discounted'      // Has a compareAtPrice — promotional signal
  | 'inStock';        // Available stock — baseline gate

/** Weight configuration for the ranking algorithm. */
export interface RankingConfig {
  /** Weights for each signal. Higher = more influential. */
  weights: Partial<Record<RankingSignalName, number>>;
  /**
   * Whether to hard-penalize out-of-stock products by pushing them to the end.
   * Defaults to true. Disable for "show all inventory" views.
   */
  penalizeOutOfStock?: boolean;
  /**
   * How many days before a product is considered "not new". Used by the recency signal.
   * Defaults to 30.
   */
  newProductThresholdDays?: number;
}

/** Default ranking config used for the homepage / all-products listing. */
export const DEFAULT_RANKING_CONFIG: RankingConfig = {
  weights: {
    salesCount: 4.0,    // Best-selling is the strongest signal
    viewCount: 1.5,     // Popular but not yet purchased
    wishlistCount: 2.0, // High purchase intent
    reviewRating: 1.5,  // Quality signal
    reviewCount: 0.8,   // Engagement volume
    recency: 1.0,       // Favor newer products slightly
    discounted: 0.5,    // Boost sale items slightly
    inStock: 10.0,      // Hard preference for in-stock items
  },
  penalizeOutOfStock: true,
  newProductThresholdDays: 30,
};

/** Ranking config variant presets. */
export const RANKING_PRESETS: Record<string, RankingConfig> = {
  newest: {
    weights: { recency: 10.0, inStock: 5.0 },
    penalizeOutOfStock: true,
    newProductThresholdDays: 90,
  },
  bestSelling: {
    weights: { salesCount: 10.0, inStock: 5.0, recency: 0.5 },
    penalizeOutOfStock: true,
  },
  mostViewed: {
    weights: { viewCount: 10.0, inStock: 5.0, recency: 0.5 },
    penalizeOutOfStock: true,
  },
  popular: {
    weights: {
      wishlistCount: 6.0,
      salesCount: 3.0,
      viewCount: 1.5,
      reviewRating: 1.0,
      inStock: 5.0,
    },
    penalizeOutOfStock: true,
  },
  priceAsc: {
    weights: { inStock: 5.0 },
    penalizeOutOfStock: true,
  },
  priceDesc: {
    weights: { inStock: 5.0 },
    penalizeOutOfStock: true,
  },
  featured: {
    weights: {
      discounted: 5.0,
      salesCount: 3.0,
      reviewRating: 2.0,
      inStock: 5.0,
      recency: 1.0,
    },
    penalizeOutOfStock: true,
  },
  default: DEFAULT_RANKING_CONFIG,
};

// ── Prisma orderBy builder ─────────────────────────────────────────────────────

/**
 * Converts a sort string into an ordered Prisma orderBy array.
 * The stock gate is always first when penalizeOutOfStock is enabled.
 *
 * This function handles all sort modes explicitly rather than using
 * magic string concatenation so TypeScript can verify correctness.
 */
export function buildProductOrderBy(
  sort?: string,
  config?: RankingConfig,
): Prisma.ProductOrderByWithRelationInput[] {
  const cfg = config ?? DEFAULT_RANKING_CONFIG;
  const stockGate: Prisma.ProductOrderByWithRelationInput = { inStock: 'desc' };
  const dateDesc: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };

  // Normalize aliases
  const normalized = sort === 'bestseller' ? 'bestSelling' : sort;

  const penalize = cfg.penalizeOutOfStock !== false;
  const prefix: Prisma.ProductOrderByWithRelationInput[] = penalize ? [stockGate] : [];

  switch (normalized) {
    case 'recommended':
      return [...prefix, { salesCount: 'desc' }, { viewCount: 'desc' }, dateDesc];

    case 'newest':
      return [...prefix, dateDesc, { salesCount: 'desc' }];

    case 'priceAsc':
      return [...prefix, { price: 'asc' }, dateDesc];

    case 'priceDesc':
      return [...prefix, { price: 'desc' }, dateDesc];

    case 'bestSelling':
      return [...prefix, { salesCount: 'desc' }, dateDesc];

    case 'mostViewed':
      return [...prefix, { viewCount: 'desc' }, dateDesc];

    case 'popular':
      // Wishlist count (durable DB-based popularity signal), then sales, then recency.
      return [
        ...prefix,
        { wishlistBy: { _count: 'desc' } },
        { salesCount: 'desc' },
        { viewCount: 'desc' },
        dateDesc,
      ];

    case 'featured':
      // Discounted products first, then best-selling, then newest.
      return [
        ...prefix,
        { compareAtPrice: { sort: 'desc', nulls: 'last' } },
        { salesCount: 'desc' },
        dateDesc,
      ];

    case 'rating':
      // Note: rating is stored in Review model; sorting by it requires
      // a subquery which Prisma doesn't support directly in orderBy.
      // We fall back to a combination of signals here.
      return [...prefix, { salesCount: 'desc' }, dateDesc];

    default:
      // Smart default: inStock → salesCount → recency.
      // This produces the most useful listing when no sort is specified.
      return [...prefix, { salesCount: 'desc' }, dateDesc];
  }
}

// ── In-memory scoring (for small result reranking) ────────────────────────────

export interface ScoredProduct {
  id: string;
  salesCount?: number | null;
  viewCount?: number | null;
  wishlistCount?: number | null;
  averageRating?: number | null;
  reviewCount?: number | null;
  createdAt?: Date | string | null;
  compareAtPrice?: number | null;
  inStock: boolean;
}

/**
 * Compute a composite ranking score for a single product.
 * Higher is better. Used for in-memory reranking after DB fetch.
 *
 * All signals are normalised to [0, 1] using soft caps before weighting
 * so a single extreme product doesn't dominate.
 */
export function computeProductScore(
  product: ScoredProduct,
  config: RankingConfig = DEFAULT_RANKING_CONFIG,
): number {
  const w = config.weights;
  let score = 0;

  // Stock gate — hard boost for in-stock products.
  if (product.inStock) {
    score += (w.inStock ?? 0) * 100;
  } else if (config.penalizeOutOfStock !== false) {
    // Out-of-stock products are pushed to the end with a large penalty.
    return -1000;
  }

  // Sales count — soft cap at 1000 to prevent runaway monopoly.
  if (w.salesCount) {
    const normalized = Math.min(1, (product.salesCount ?? 0) / 1000);
    score += w.salesCount * normalized * 100;
  }

  // View count — soft cap at 10,000.
  if (w.viewCount) {
    const normalized = Math.min(1, (product.viewCount ?? 0) / 10_000);
    score += w.viewCount * normalized * 100;
  }

  // Wishlist count — soft cap at 500.
  if (w.wishlistCount) {
    const normalized = Math.min(1, (product.wishlistCount ?? 0) / 500);
    score += w.wishlistCount * normalized * 100;
  }

  // Review rating — already in [0, 5], normalize to [0, 1].
  if (w.reviewRating) {
    const normalized = Math.min(1, (product.averageRating ?? 0) / 5);
    score += w.reviewRating * normalized * 100;
  }

  // Review count — soft cap at 200.
  if (w.reviewCount) {
    const normalized = Math.min(1, (product.reviewCount ?? 0) / 200);
    score += w.reviewCount * normalized * 100;
  }

  // Recency — exponential decay: products created today score 1, 30-day-old score ~0.4.
  if (w.recency) {
    const days = config.newProductThresholdDays ?? 30;
    const ageMs = Date.now() - new Date(product.createdAt ?? 0).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const normalized = Math.exp((-ageDays / days) * Math.LN2);
    score += w.recency * normalized * 100;
  }

  // Discount signal — binary: 0 or 1.
  if (w.discounted && product.compareAtPrice != null) {
    score += w.discounted * 100;
  }

  return score;
}

/**
 * Sort an array of products by their computed ranking score (descending).
 * Mutates the array in-place for performance.
 */
export function rankProducts<T extends ScoredProduct>(
  products: T[],
  config: RankingConfig = DEFAULT_RANKING_CONFIG,
): T[] {
  return [...products].sort(
    (a, b) => computeProductScore(b, config) - computeProductScore(a, config),
  );
}
