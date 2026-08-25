import { prisma, isDatabaseConfigured } from '@/lib/db';
import { computeProductScore, RANKING_PRESETS } from '@/server/algorithms/product-ranking';
import type { ProductSummary } from '@/types';
import type { OrderStatus } from '@/types/order';

const COMPLETED_ORDER_STATUSES: OrderStatus[] = ['confirmed', 'processing', 'shipped', 'delivered'];
const PROFILE_TTL_MS = 15 * 60 * 1000;
type Preference = { category: number; seller: number };
type RecommendationProfile = {
  categoryScores: Record<string, number>;
  sellerScores: Record<string, number>;
  wishlistIds: string[];
  reviewedIds: string[];
  purchasedIds: string[];
};

function emptyProfile(): RecommendationProfile {
  return { categoryScores: {}, sellerScores: {}, wishlistIds: [], reviewedIds: [], purchasedIds: [] };
}

async function loadProfile(userId: string): Promise<RecommendationProfile> {
  const rows = await prisma.$queryRaw<Array<{ profileJson: unknown; updatedAt: Date }>>`
    SELECT "profileJson", "updatedAt"
    FROM "UserRecommendationProfile"
    WHERE "userId" = ${userId}
    LIMIT 1
  `;
  const row = rows[0];
  if (row && Date.now() - row.updatedAt.getTime() < PROFILE_TTL_MS) {
    return (row.profileJson ?? emptyProfile()) as RecommendationProfile;
  }

  const [wishlist, reviews, orders] = await Promise.all([
    prisma.wishlistItem.findMany({ where: { userId }, select: { productId: true, product: { select: { category: { select: { key: true } }, sellerId: true } } } }),
    prisma.review.findMany({ where: { userId }, select: { productId: true, rating: true, product: { select: { category: { select: { key: true } }, sellerId: true } } } }),
    prisma.orderItem.findMany({ where: { order: { userId, status: { in: COMPLETED_ORDER_STATUSES } } }, select: { productId: true, quantity: true } }),
  ]);

  const orderProductIds = [...new Set(orders.map((item) => item.productId))];
  const orderedProducts = orderProductIds.length
    ? await prisma.product.findMany({ where: { id: { in: orderProductIds } }, select: { id: true, category: { select: { key: true } }, sellerId: true } })
    : [];
  const orderedProductById = new Map(orderedProducts.map((product) => [product.id, product]));

  const preferences = new Map<string, Preference>();
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
  orders.forEach((item) => {
    const product = orderedProductById.get(item.productId);
    addPreference(product?.category?.key, product?.sellerId, Math.min(8, item.quantity * 3));
  });

  const categoryScores: Record<string, number> = {};
  const sellerScores: Record<string, number> = {};
  for (const [key, value] of preferences) {
    const [category, seller] = key.split('|');
    if (category) categoryScores[category] = (categoryScores[category] ?? 0) + value.category;
    if (seller) sellerScores[seller] = (sellerScores[seller] ?? 0) + value.seller;
  }

  const profile: RecommendationProfile = {
    categoryScores,
    sellerScores,
    wishlistIds: wishlist.map((item) => item.productId),
    reviewedIds: reviews.map((item) => item.productId),
    purchasedIds: orders.map((item) => item.productId),
  };

  await prisma.$executeRaw`
    INSERT INTO "UserRecommendationProfile" ("userId", "profileJson", "updatedAt")
    VALUES (${userId}, ${JSON.stringify(profile)}::jsonb, NOW())
    ON CONFLICT ("userId") DO UPDATE
      SET "profileJson" = EXCLUDED."profileJson", "updatedAt" = EXCLUDED."updatedAt"
  `;
  return profile;
}

/** Re-ranks a global candidate set using a durable, periodically refreshed customer profile. */
export async function rankProductsForUser(products: ProductSummary[], userId: string | null, mode: 'popular' | 'bestSelling' | 'recommended' = 'recommended'): Promise<ProductSummary[]> {
  if (!userId || !isDatabaseConfigured() || products.length < 2) return products;
  try {
    const profile = await loadProfile(userId);
    const categoryScores = new Map(Object.entries(profile.categoryScores));
    const sellerScores = new Map(Object.entries(profile.sellerScores));
    const wishlistIds = new Set(profile.wishlistIds);
    const reviewedIds = new Set(profile.reviewedIds);
    const purchasedIds = new Set(profile.purchasedIds);
    const preset = RANKING_PRESETS[mode === 'bestSelling' ? 'bestSelling' : mode === 'popular' ? 'popular' : 'default'];

    const score = (product: ProductSummary) => {
      const global = computeProductScore({ id: product.id, salesCount: product.salesCount, viewCount: product.viewCount, averageRating: product.averageRating, reviewCount: product.reviewCount, compareAtPrice: product.comparePrice, inStock: product.inStock }, preset) * 0.7;
      const categoryBoost = Math.min(1, (categoryScores.get(product.categoryKey) ?? 0) / 12) * 60;
      const sellerBoost = product.sellerId ? Math.min(1, (Number(sellerScores.get(product.sellerId) ?? 0)) / 10) * 24 : 0;
      const wishlistBoost = wishlistIds.has(product.id) ? 32 : 0;
      const reviewBoost = reviewedIds.has(product.id) ? 12 : 0;
      const purchasedPenalty = purchasedIds.has(product.id) ? (mode === 'recommended' ? -8 : 0) : 0;
      return global + categoryBoost + sellerBoost + wishlistBoost + reviewBoost + purchasedPenalty;
    };

    return [...products].sort((a, b) => {
      const diff = score(b) - score(a);
      return diff !== 0 ? diff : a.id.localeCompare(b.id);
    });
  } catch {
    return products;
  }
}
