/**
 * Shared product ranking primitives.
 *
 * The database order is used for broad candidate retrieval; the same
 * RankingConfig is then used for final in-memory ranking. All tie breaks use
 * product id so pagination remains deterministic.
 */
import type { Prisma } from '@prisma/client';
import type { ProductSummary } from '@/types';

export type RankingSignalName = 'salesCount' | 'viewCount' | 'wishlistCount' | 'reviewRating' | 'reviewCount' | 'recency' | 'discounted' | 'inStock';

export interface RankingConfig {
  weights: Partial<Record<RankingSignalName, number>>;
  penalizeOutOfStock?: boolean;
  newProductThresholdDays?: number;
}

export const DEFAULT_RANKING_CONFIG: RankingConfig = {
  weights: { salesCount: 4, viewCount: 1.5, wishlistCount: 2, reviewRating: 1.5, reviewCount: 0.8, recency: 1, discounted: 0.5, inStock: 10 },
  penalizeOutOfStock: true,
  newProductThresholdDays: 30,
};

export const RANKING_PRESETS: Record<string, RankingConfig> = {
  newest: { weights: { recency: 10, inStock: 5 }, penalizeOutOfStock: true, newProductThresholdDays: 90 },
  bestSelling: { weights: { salesCount: 10, inStock: 5, recency: 0.5 }, penalizeOutOfStock: true },
  mostViewed: { weights: { viewCount: 10, inStock: 5, recency: 0.5 }, penalizeOutOfStock: true },
  popular: { weights: { wishlistCount: 6, salesCount: 3, viewCount: 1.5, reviewRating: 1, inStock: 5 }, penalizeOutOfStock: true },
  priceAsc: { weights: { inStock: 5 }, penalizeOutOfStock: true },
  priceDesc: { weights: { inStock: 5 }, penalizeOutOfStock: true },
  featured: { weights: { discounted: 5, salesCount: 3, reviewRating: 2, inStock: 5, recency: 1 }, penalizeOutOfStock: true },
  default: DEFAULT_RANKING_CONFIG,
};

export function buildProductOrderBy(sort?: string, config?: RankingConfig): Prisma.ProductOrderByWithRelationInput[] {
  const cfg = config ?? DEFAULT_RANKING_CONFIG;
  const prefix: Prisma.ProductOrderByWithRelationInput[] = cfg.penalizeOutOfStock === false ? [] : [{ inStock: 'desc' }];
  const normalized = sort === 'bestseller' ? 'bestSelling' : sort;
  switch (normalized) {
    case 'recommended':
    case 'default': return [...prefix, { salesCount: 'desc' }, { viewCount: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }];
    case 'newest': return [...prefix, { createdAt: 'desc' }, { salesCount: 'desc' }, { id: 'asc' }];
    case 'priceAsc': return [...prefix, { price: 'asc' }, { createdAt: 'desc' }, { id: 'asc' }];
    case 'priceDesc': return [...prefix, { price: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }];
    case 'bestSelling': return [...prefix, { salesCount: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }];
    case 'mostViewed': return [...prefix, { viewCount: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }];
    case 'popular': return [...prefix, { wishlistBy: { _count: 'desc' } }, { salesCount: 'desc' }, { viewCount: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }];
    case 'featured': return [...prefix, { compareAtPrice: { sort: 'desc', nulls: 'last' } }, { salesCount: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }];
    case 'rating': return [...prefix, { salesCount: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }];
    default: return [...prefix, { salesCount: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }];
  }
}

export interface ScoredProduct { id: string; salesCount?: number | null; viewCount?: number | null; wishlistCount?: number | null; averageRating?: number | null; reviewCount?: number | null; createdAt?: Date | string | null; compareAtPrice?: number | null; inStock: boolean; }

export function computeProductScore(product: ScoredProduct, config: RankingConfig = DEFAULT_RANKING_CONFIG): number {
  const w = config.weights;
  let score = product.inStock ? (w.inStock ?? 0) * 100 : (config.penalizeOutOfStock !== false ? -1000 : 0);
  if (w.salesCount) score += w.salesCount * Math.min(1, (product.salesCount ?? 0) / 1000) * 100;
  if (w.viewCount) score += w.viewCount * Math.min(1, (product.viewCount ?? 0) / 10000) * 100;
  if (w.wishlistCount) score += w.wishlistCount * Math.min(1, (product.wishlistCount ?? 0) / 500) * 100;
  if (w.reviewRating) score += w.reviewRating * Math.min(1, (product.averageRating ?? 0) / 5) * 100;
  if (w.reviewCount) score += w.reviewCount * Math.min(1, (product.reviewCount ?? 0) / 200) * 100;
  if (w.recency) {
    const days = config.newProductThresholdDays ?? 30;
    const ageDays = Math.max(0, (Date.now() - new Date(product.createdAt ?? 0).getTime()) / 86400000);
    score += w.recency * Math.exp((-ageDays / days) * Math.LN2) * 100;
  }
  if (w.discounted && product.compareAtPrice != null) score += w.discounted * 100;
  return score;
}

export function rankProducts<T extends ScoredProduct>(products: T[], config: RankingConfig = DEFAULT_RANKING_CONFIG): T[] {
  return [...products].sort((a, b) => {
    const diff = computeProductScore(b, config) - computeProductScore(a, config);
    return diff !== 0 ? diff : a.id.localeCompare(b.id);
  });
}

export interface DiversityOptions { maxPerSeller?: number; maxPerCategory?: number; }

/** Prevents one seller/category from consuming an entire recommendation page. */
export function diversifyProducts(products: ProductSummary[], options: DiversityOptions = {}): ProductSummary[] {
  const maxPerSeller = Math.max(1, options.maxPerSeller ?? 3);
  const maxPerCategory = Math.max(1, options.maxPerCategory ?? 4);
  const selected: ProductSummary[] = [];
  const deferred: ProductSummary[] = [];
  const sellerCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();

  for (const product of products) {
    const seller = product.sellerId ?? 'unknown';
    const category = product.categoryKey ?? 'unknown';
    if ((sellerCounts.get(seller) ?? 0) < maxPerSeller && (categoryCounts.get(category) ?? 0) < maxPerCategory) {
      selected.push(product);
      sellerCounts.set(seller, (sellerCounts.get(seller) ?? 0) + 1);
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    } else {
      deferred.push(product);
    }
  }
  return [...selected, ...deferred];
}
