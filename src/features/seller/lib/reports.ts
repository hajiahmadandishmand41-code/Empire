/**
 * Seller reports — Phase 4 (Seller Marketplace).
 *
 * Server-only. Aggregates completed sales for a single seller: revenue,
 * order counts, best-selling products. Excludes cancelled orders from
 * revenue but keeps them in raw order counts so the seller sees churn.
 */
import { prisma, isDatabaseConfigured } from '@/lib/db';

export interface SellerReport {
  currency: string;
  totals: {
    orders: number;              // distinct orders containing seller items
    unitsSold: number;           // sum of quantities across non-cancelled orders
    revenue: number;             // sum(price * qty) across non-cancelled orders
    pendingOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
  };
  topProducts: Array<{
    productId: string;
    name: string;
    slug: string;
    unitsSold: number;
    revenue: number;
  }>;
  source: 'db' | 'empty';
}

export async function getSellerReport(sellerId: string): Promise<SellerReport> {
  const empty: SellerReport = {
    currency: 'AFN',
    totals: {
      orders: 0,
      unitsSold: 0,
      revenue: 0,
      pendingOrders: 0,
      processingOrders: 0,
      shippedOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
    },
    topProducts: [],
    source: 'empty',
  };
  if (!isDatabaseConfigured()) return empty;

  try {
    const items = await prisma.orderItem.findMany({
      where: { product: { sellerId } },
      include: {
        order: { select: { id: true, status: true, currency: true } },
        product: { select: { id: true, name: true, slug: true } },
      },
    });

    const orderIds = new Set<string>();
    const statusCounts = { pending: 0, confirmed: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
    const seenOrderStatus = new Map<string, keyof typeof statusCounts>();

    let unitsSold = 0;
    let revenue = 0;
    let currency = 'AFN';
    const productMap = new Map<
      string,
      { productId: string; name: string; slug: string; unitsSold: number; revenue: number }
    >();

    for (const it of items) {
      orderIds.add(it.orderId);
      const status = it.order.status as keyof typeof statusCounts;
      if (!seenOrderStatus.has(it.orderId)) {
        seenOrderStatus.set(it.orderId, status);
        statusCounts[status] = (statusCounts[status] ?? 0) + 1;
      }
      if (it.order.currency) currency = it.order.currency;
      if (status !== 'cancelled') {
        unitsSold += it.quantity;
        revenue += it.price * it.quantity;
        const key = it.productId;
        const existing = productMap.get(key);
        if (existing) {
          existing.unitsSold += it.quantity;
          existing.revenue += it.price * it.quantity;
        } else {
          productMap.set(key, {
            productId: it.productId,
            name: it.product?.name ?? it.name,
            slug: it.product?.slug ?? it.slug,
            unitsSold: it.quantity,
            revenue: it.price * it.quantity,
          });
        }
      }
    }

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);

    return {
      currency,
      totals: {
        orders: orderIds.size,
        unitsSold,
        revenue,
        pendingOrders: statusCounts.pending + statusCounts.confirmed,
        processingOrders: statusCounts.processing,
        shippedOrders: statusCounts.shipped,
        deliveredOrders: statusCounts.delivered,
        cancelledOrders: statusCounts.cancelled,
      },
      topProducts,
      source: 'db',
    };
  } catch (err) {
    console.error('[seller/reports]', err);
    return empty;
  }
}
