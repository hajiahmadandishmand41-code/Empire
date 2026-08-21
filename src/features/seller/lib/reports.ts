/** Seller reports — server-only PostgreSQL aggregation. */
import { prisma, isDatabaseConfigured } from '@/lib/db';

export interface SellerReport {
  currency: string;
  totals: {
    orders: number;
    unitsSold: number;
    revenue: number;
    pendingOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
  };
  topProducts: Array<{ productId: string; name: string; slug: string; unitsSold: number; revenue: number }>;
  source: 'db' | 'empty';
}

export async function getSellerReport(sellerId: string): Promise<SellerReport> {
  const empty: SellerReport = {
    currency: 'AFN',
    totals: { orders: 0, unitsSold: 0, revenue: 0, pendingOrders: 0, processingOrders: 0, shippedOrders: 0, deliveredOrders: 0, cancelledOrders: 0 },
    topProducts: [],
    source: 'empty',
  };
  if (!isDatabaseConfigured()) return empty;

  try {
    const [totalsRow] = await prisma.$queryRaw<Array<{
      currency: string | null;
      orders: bigint;
      unitsSold: bigint | null;
      revenue: number | null;
      pendingOrders: bigint;
      processingOrders: bigint;
      shippedOrders: bigint;
      deliveredOrders: bigint;
      cancelledOrders: bigint;
    }>>`
      SELECT
        MAX(o."currency") AS currency,
        COUNT(DISTINCT o."id") AS orders,
        COALESCE(SUM(CASE WHEN o."status" <> 'cancelled' THEN oi."quantity" ELSE 0 END), 0) AS "unitsSold",
        COALESCE(SUM(CASE WHEN o."status" <> 'cancelled' THEN oi."price" * oi."quantity" ELSE 0 END), 0) AS revenue,
        COUNT(DISTINCT o."id") FILTER (WHERE o."status" IN ('pending', 'confirmed')) AS "pendingOrders",
        COUNT(DISTINCT o."id") FILTER (WHERE o."status" = 'processing') AS "processingOrders",
        COUNT(DISTINCT o."id") FILTER (WHERE o."status" = 'shipped') AS "shippedOrders",
        COUNT(DISTINCT o."id") FILTER (WHERE o."status" = 'delivered') AS "deliveredOrders",
        COUNT(DISTINCT o."id") FILTER (WHERE o."status" = 'cancelled') AS "cancelledOrders"
      FROM "OrderItem" oi
      INNER JOIN "Order" o ON o."id" = oi."orderId"
      INNER JOIN "Product" p ON p."id" = oi."productId"
      WHERE p."sellerId" = ${sellerId}
    `;

    const topProducts = await prisma.$queryRaw<Array<{
      productId: string;
      name: string;
      slug: string;
      unitsSold: bigint;
      revenue: number;
    }>>`
      SELECT
        oi."productId" AS "productId",
        MAX(oi."name") AS name,
        MAX(oi."slug") AS slug,
        COALESCE(SUM(CASE WHEN o."status" <> 'cancelled' THEN oi."quantity" ELSE 0 END), 0) AS "unitsSold",
        COALESCE(SUM(CASE WHEN o."status" <> 'cancelled' THEN oi."price" * oi."quantity" ELSE 0 END), 0) AS revenue
      FROM "OrderItem" oi
      INNER JOIN "Order" o ON o."id" = oi."orderId"
      INNER JOIN "Product" p ON p."id" = oi."productId"
      WHERE p."sellerId" = ${sellerId}
      GROUP BY oi."productId"
      ORDER BY "unitsSold" DESC, revenue DESC
      LIMIT 5
    `;

    return {
      currency: totalsRow?.currency ?? 'AFN',
      totals: {
        orders: Number(totalsRow?.orders ?? 0),
        unitsSold: Number(totalsRow?.unitsSold ?? 0),
        revenue: Number(totalsRow?.revenue ?? 0),
        pendingOrders: Number(totalsRow?.pendingOrders ?? 0),
        processingOrders: Number(totalsRow?.processingOrders ?? 0),
        shippedOrders: Number(totalsRow?.shippedOrders ?? 0),
        deliveredOrders: Number(totalsRow?.deliveredOrders ?? 0),
        cancelledOrders: Number(totalsRow?.cancelledOrders ?? 0),
      },
      topProducts: topProducts.map((row) => ({
        productId: row.productId,
        name: row.name,
        slug: row.slug,
        unitsSold: Number(row.unitsSold ?? 0),
        revenue: Number(row.revenue ?? 0),
      })),
      source: 'db',
    };
  } catch (err) {
    console.error('[seller/reports]', err);
    return empty;
  }
}
