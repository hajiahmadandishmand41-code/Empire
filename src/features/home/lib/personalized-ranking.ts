import { prisma, isDatabaseConfigured } from '@/lib/db';
import { computeProductScore, RANKING_PRESETS } from '@/server/algorithms/product-ranking';
import type { ProductSummary } from '@/types';

const COMPLETED_ORDER_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered'] as const;

type Preference = { category: number; seller: number };

/**
 * Re-ranks a global candidate set for a signed-in customer.
 * Durable signals are used because the schema currently stores orders,
 * wishlists and reviews per user, but not a per-user view-history table.
 */
export async function rankProductsForUser(products: ProductSummary[], userId: string | null, mode: 'popular' | 'bestSelling' | 'recommended' = 'recommended'): Promise<ProductSummary[]> {
  if (!userId || !isDatabaseConfigured() || products.length < 2) return products;

  try {
    const [wishlist, reviews, orders] = await Promise.all([
      prisma.wishlistItem.findMany({
        where: { userId },
        select: { productId: true, product: { select: { category: { select: { key: true } }, sellerId: true } } },
      }),
      prisma.review.findMany({
        where: { userId },
        select: { productId: true, rating: true, product: { select: { category: { select: { key: true } }, sellerId: true } } },
      }),
      prisma.orderItem.findMany({
        where: { order: { userId, status: { in: COMPLETED_ORDER_STATUSES } } },
        select: { productId: true, quantity: true, product: { select: { category: { select: { key: true } }, sellerId: true } } },
      }),
    ]);

    const preferences = new Map<string, Preference>();
    const wishlistIds = new Set(wishlist.map((item) => item.productId));
    const reviewedIds = new Set(reviews.map((item) => item.productId));
    const purchasedIds = new Set(orders.map((item) => item.productId));

    const addPreference = (category: string | undefined, sellerId: string | null | undefined, amount: number) => {
      if (!category && !sellerId) return;
      const key = `${category ?? ''}|${sellerId ?? ''}`;
      const current = preferences.get(key) ?? { category: 0, seller: 0 };
      current.category += category ? amount : 0;
      current.seller += sellerId ? amount : 0;
      preferences.set(key, current);
    };

    wishlist.forEach((item) => addPreference(item.product.category?.key, item.product.sellerId, 3));
    reviews.forEach((item) => addPreference(item.product.category?.key, item.product.sellerId, Math.max(1, item.rating / 2)));
    orders.forEach((item) => addPreference(item.product.category?.key, item.product.sellerId, Math.min(8, item.quantity * 3)));

    const categoryScores = new Map<string, number>();
    const sellerScores = new Map<string, number>();
    for (const [key, value] of preferences) {
      const [category, seller] = key.split('|');
      if (category) categoryScores.set(category, (categoryScores.get(category) ?? 0) + value.category);
      if (seller) sellerScores.set(seller, (sellerScores.get(seller) ?? 0) + value.seller);
    }

    const preset = RANKING_PRESETS[mode === 'bestSelling' ? 'bestSelling' : mode === 'popular' ? 'popular' : 'default'];
    return [...products].sort((a, b) => {
      const score = (product: ProductSummary) => {
        const global = computeProductScore({
          id: product.id,
          salesCount: product.salesCount,
          viewCount: product.viewCount,
          averageRating: product.averageRating,
          reviewCount: product.reviewCount,
          compareAtPrice: product.comparePrice,
          inStock: product.inStock,
        }, preset) * 0.7;
        const categoryBoost = Math.min(1, (categoryScores.get(product.categoryKey) ?? 0) / 12) * 60;
        const sellerBoost = product.sellerId ? Math.min(1, (sellerScores.get(product.sellerId) ?? 0) / 10) * 24 : 0;
        const wishlistBoost = wishlistIds.has(product.id) ? 32 : 0;
        const reviewBoost = reviewedIds.has(product.id) ? 12 : 0;
        const purchasedPenalty = purchasedIds.has(product.id) ? (mode === 'recommended' ? -8 : 0) : 0;
        return global + categoryBoost + sellerBoost + wishlistBoost + reviewBoost + purchasedPenalty;
      };
      return score(b) - score(a);
    });
  } catch {
    // Personalization must never make a marketplace page fail.
    return products;
  }
}
