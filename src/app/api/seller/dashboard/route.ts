/**
 * Seller Dashboard API — Phase 13 (Prisma)
 *
 * GET /api/seller/dashboard
 */
import { NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import { jsonError } from '@/lib/api/response';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;

  if (!isDatabaseConfigured()) {
    return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  }

  try {
    const sellerId = guard.user.id;

    const [productCount, activeProducts, outOfStockProducts, orderItems] = await Promise.all([
      prisma.product.count({ where: { sellerId } }),
      prisma.product.count({ where: { sellerId, isActive: true } }),
      prisma.product.count({ where: { sellerId, inStock: false } }),
      prisma.orderItem.findMany({
        where: { product: { sellerId } },
        select: {
          price: true,
          quantity: true,
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
    const orderIdsSeen = new Set<string>();

    for (const item of orderItems) {
      const isMonth = item.order.createdAt >= thisMonth;
      const lineRevenue = Number(item.price) * item.quantity;

      if (item.order.status !== 'cancelled') {
        totalRevenue += lineRevenue;
        if (isMonth) monthRevenue += lineRevenue;
      }

      if (!orderIdsSeen.has(item.order.id)) {
        orderIdsSeen.add(item.order.id);
        totalOrders += 1;
        if (isMonth) monthOrders += 1;
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
