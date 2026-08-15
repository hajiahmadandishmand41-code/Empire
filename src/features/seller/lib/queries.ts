/**
 * Seller data queries — Phase 11.4 + Phase 4 (Seller Marketplace).
 *
 * Server-only helpers. Reads from Prisma when `DATABASE_URL` is
 * configured, and falls back to the mock adapter **only in development**.
 * In production, if the database is unavailable or a query fails, an
 * error is thrown so the route handler can return the correct HTTP
 * status (503 / 500) — no mock data is ever served in production.
 */
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { mockSellerStats, type SellerStats } from './mock-data';

const isDev = process.env.NODE_ENV !== 'production';

export interface SellerStatsResult extends SellerStats {
  revenue: number;
  currency: string;
  pendingOrders: number;
  source: 'db' | 'mock';
}

export async function getSellerStats(sellerId?: string): Promise<SellerStatsResult> {
  const emptyBase = {
    products: 0,
    orders: 0,
    activeProducts: 0,
    outOfStockProducts: 0,
    revenue: 0,
    currency: 'AFN',
    pendingOrders: 0,
  };

  if (!isDatabaseConfigured()) {
    if (!isDev) throw new Error('Database not configured');
    if (sellerId) return { ...emptyBase, source: 'mock' };
    return { ...mockSellerStats, revenue: 0, currency: 'AFN', pendingOrders: 0, source: 'mock' };
  }
  try {
    const productWhere = sellerId ? { sellerId } : {};
    const [products, activeProducts, outOfStockProducts] = await Promise.all([
      prisma.product.count({ where: productWhere }),
      prisma.product.count({ where: { ...productWhere, inStock: true } }),
      prisma.product.count({ where: { ...productWhere, inStock: false } }),
    ]);

    let orders = 0;
    let revenue = 0;
    let currency = 'AFN';
    let pendingOrders = 0;

    if (sellerId) {
      const items = await prisma.orderItem.findMany({
        where: { product: { sellerId } },
        select: {
          orderId: true,
          price: true,
          quantity: true,
          order: { select: { status: true, currency: true } },
        },
      });
      const orderIds = new Set<string>();
      const seen = new Set<string>();
      for (const it of items) {
        orderIds.add(it.orderId);
        currency = it.order.currency || currency;
        if (it.order.status !== 'cancelled') revenue += it.price * it.quantity;
        if (!seen.has(it.orderId)) {
          seen.add(it.orderId);
          if (it.order.status === 'pending' || it.order.status === 'confirmed') {
            pendingOrders += 1;
          }
        }
      }
      orders = orderIds.size;
    } else {
      orders = await prisma.order.count();
    }

    if (isDev && products === 0 && orders === 0 && !sellerId) {
      return { ...mockSellerStats, revenue: 0, currency: 'AFN', pendingOrders: 0, source: 'mock' };
    }
    return {
      products,
      orders,
      activeProducts,
      outOfStockProducts,
      revenue,
      currency,
      pendingOrders,
      source: 'db',
    };
  } catch (err) {
    console.error('[seller/stats] DB error:', err);
    if (isDev) {
      if (sellerId) return { ...emptyBase, source: 'mock' };
      return { ...mockSellerStats, revenue: 0, currency: 'AFN', pendingOrders: 0, source: 'mock' };
    }
    throw err;
  }
}
