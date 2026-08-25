import type { ProductSummary } from '@/types';

export interface DiversityOptions {
  maxPerSeller?: number;
  maxPerCategory?: number;
}

/** Preserve relevance while preventing one seller/category from filling a page. */
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
