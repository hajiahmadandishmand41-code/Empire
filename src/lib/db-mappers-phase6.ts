/**
 * Prisma -> domain mappers for Phase 6 (reviews, wishlist).
 */
import type { Review as PReview, User as PUser, WishlistItem as PWishlistItem } from '@prisma/client';
import type { Review, WishlistEntry, ProductRatingSummary, ProductSummary } from '@/types';

export function mapReview(r: PReview & { user: Pick<PUser, 'id' | 'fullName'> }): Review {
  return {
    id: r.id,
    productId: r.productId,
    rating: r.rating,
    title: r.title ?? undefined,
    comment: r.comment ?? undefined,
    isApproved: r.isApproved,
    author: { id: r.user.id, fullName: r.user.fullName },
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export function summarizeRatings(
  rows: Array<Pick<PReview, 'rating'>>,
): ProductRatingSummary {
  const distribution: ProductRatingSummary['distribution'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const r of rows) {
    const bucket = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[bucket] += 1;
    sum += r.rating;
  }
  const count = rows.length;
  const average = count === 0 ? 0 : Math.round((sum / count) * 10) / 10;
  return { average, count, distribution };
}

export function mapWishlistEntry(
  w: PWishlistItem & { product: ProductSummary },
): WishlistEntry {
  return {
    id: w.id,
    productId: w.productId,
    createdAt: w.createdAt.toISOString(),
    product: w.product,
  };
}
