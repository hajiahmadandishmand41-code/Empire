/**
 * Seller Dashboard API — Phase 13 (Prisma)
 *
 * GET /api/seller/dashboard
 *
 * Returns stats for the currently authenticated seller.
 * Deprecated in favor of the server-rendered dashboard page,
 * but kept for client-side consumption by legacy components.
 *
 * Stage 6 fixes:
 *  - orderIdsSeen now keys on order.id (was: JSON.stringify(createdAt) — wrong,
 *    caused duplicate order counts when two orders shared the same timestamp).
 *  - pendingOrders now increments once per unique order, not once per item.
 *  - order sub-select now includes `id` so deduplication is correct.
 *  - console.error replaced with structured logger.
 */
import { NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;

  const isDev = process.env.NODE_ENV !== 'production';

  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  try {
    const sellerId = guard.user.id;

    const [productCount, activeProducts, outOfStockProducts, orderItems] = await Promise.all([
      prisma.product.count({ where: { sellerId } }),
      prisma.product.count({ where: { sellerId, isActive: true } }),
      prisma.product.count({ where: { sellerId, inStock: false } }),
      prisma.orderItem.findMany({
        where: { product: { sellerId } },
        select: {
          price: true, quantity: true,
          // FIX: include `id` so we can deduplicate orders correctly.
          order: { select: { id: true, status: true, createdAt: true } },
        },
      }),
    ]);

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalRevenue = 0;
    let monthRevenue = 0;
    let pendingOrders = 0;
    let totalOrders = 0;
    let monthOrders = 0;
    // FIX: track unique orders by their actual id, not by createdAt timestamp.
    const orderIdsSeen = new Set<string>();

    for (const item of orderItems) {
      const isMonth = new Date(item.order.createdAt) >= thisMonth;

      if (item.order.status !== 'cancelled') {
        totalRevenue += item.price * item.quantity;
        if (isMonth) monthRevenue += item.price * item.quantity;
      }

      // FIX: count each unique order exactly once, not once per item.
      if (!orderIdsSeen.has(item.order.id)) {
        orderIdsSeen.add(item.order.id);
        totalOrders += 1;
        if (isMonth) monthOrders += 1;
        // FIX: pendingOrders is per order, not per item.
        if (item.order.status === 'pending' || item.order.status === 'confirmed') {
          pendingOrders += 1;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        stats: {
          totalRevenue,
          monthRevenue,
          revenueChange: 0,
          totalOrders,
          monthOrders,
          ordersChange: 0,
          totalProducts: productCount,
          activeProducts,
          outOfStockProducts,
          pendingOrders,
        },
        recentOrders: [],
        topProducts: [],
        source: 'db',
      },
    });
  } catch (err) {
    logger.error('seller.dashboard.error', {}, err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
