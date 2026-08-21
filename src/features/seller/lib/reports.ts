/** Seller reports — server-only PostgreSQL aggregation. */
import { prisma, isDatabaseConfigured } from '@/lib/db';

export interface SellerRevenueByCurrency {
  currency: string;
  revenue: number;
  orders: number;
}

export interface SellerProductReport {
  productId: string;
  name: string;
  slug: string;
  unitsSold: number;
  revenue: number;
  revenueByCurrency: SellerRevenueByCurrency[];
}

export interface SellerReport {
  currency: string;
  revenueByCurrency: SellerRevenueByCurrency[];
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
  topProducts: SellerProductReport[];
  source: 'db' | 'empty';
}

export async function getSellerReport(sellerId: string): Promise<SellerReport> {
  const empty: SellerReport = {
    currency: 'AFN',
    revenueByCurrency: [],
    totals: { orders: 0, unitsSold: 0, revenue: 0, pendingOrders: 0, processingOrders: 0, shippedOrders: 0, deliveredOrders: 0, cancelledOrders: 0 },
    topProducts: [],
    source: 'empty',
  };
  if (!isDatabaseConfigured()) return empty;

  try {
    const [statusRow] = await prisma.$queryRaw<Array<{
      orders: bigint;
      unitsSold: bigint | null;
      pendingOrders: bigint;
      processingOrders: bigint;
      shippedOrders: bigint;
      deliveredOrders: bigint;
      cancelledOrders: bigint;
    }>>`
      SELECT
        COUNT(DISTINCT o."id") AS orders,
        COALESCE(SUM(CASE WHEN o."status" <> 'cancelled' THEN oi."quantity" ELSE 0 END), 0) AS "unitsSold",
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

    const revenueRows = await prisma.$queryRaw<Array<{
      currency: string | null;
      orders: bigint;
      revenue: number | null;
    }>>`
      SELECT
        o."currency" AS currency,
        COUNT(DISTINCT o."id") AS orders,
        COALESCE(SUM(CASE WHEN o."status" <> 'cancelled' THEN oi."price" * oi."quantity" ELSE 0 END), 0) AS revenue
      FROM "OrderItem" oi
      INNER JOIN "Order" o ON o."id" = oi."orderId"
      INNER JOIN "Product" p ON p."id" = oi."productId"
      WHERE p."sellerId" = ${sellerId}
      GROUP BY o."currency"
      ORDER BY o."currency" ASC
    `;

    const productRows = await prisma.$queryRaw<Array<{
      productId: string;
      currency: string | null;
      name: string;
      slug: string;
      unitsSold: bigint | null;
      revenue: number | null;
    }>>`
      SELECT
        oi."productId" AS "productId",
        o."currency" AS currency,
        MAX(oi."name") AS name,
        MAX(oi."slug") AS slug,
        COALESCE(SUM(CASE WHEN o."status" <> 'cancelled' THEN oi."quantity" ELSE 0 END), 0) AS "unitsSold",
        COALESCE(SUM(CASE WHEN o."status" <> 'cancelled' THEN oi."price" * oi."quantity" ELSE 0 END), 0) AS revenue
      FROM "OrderItem" oi
      INNER JOIN "Order" o ON o."id" = oi."orderId"
      INNER JOIN "Product" p ON p."id" = oi."productId"
      WHERE p."sellerId" = ${sellerId}
      GROUP BY oi."productId", o."currency"
      ORDER BY "unitsSold" DESC, revenue DESC
    `;

    const revenueByCurrency = revenueRows.map((row) => ({
      currency: row.currency ?? 'UNKNOWN',
      revenue: Number(row.revenue ?? 0),
      orders: Number(row.orders ?? 0),
    }));
    const singleCurrency = revenueByCurrency.length === 1 ? revenueByCurrency[0].currency : null;
    const currency = singleCurrency ?? (revenueByCurrency.length > 1 ? 'MULTI' : 'AFN');

    const products = new Map<string, SellerProductReport>();
    for (const row of productRows) {
      const product = products.get(row.productId) ?? {
        productId: row.productId,
        name: row.name,
        slug: row.slug,
        unitsSold: 0,
        revenue: 0,
        revenueByCurrency: [],
      };
      const rowRevenue = Number(row.revenue ?? 0);
      product.unitsSold += Number(row.unitsSold ?? 0);
      product.revenue += rowRevenue;
      const currencyRow = product.revenueByCurrency.find((item) => item.currency === (row.currency ?? 'UNKNOWN'));
      if (currencyRow) {
        currencyRow.revenue += rowRevenue;
      } else {
        product.revenueByCurrency.push({ currency: row.currency ?? 'UNKNOWN', revenue: rowRevenue, orders: 0 });
      }
      products.set(row.productId, product);
    }

    const topProducts = Array.from(products.values())
      .sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue)
      .slice(0, 5)
      .map((product) => ({
        ...product,
        revenue: singleCurrency ? product.revenue : 0,
        revenueByCurrency: product.revenueByCurrency.sort((a, b) => b.revenue - a.revenue),
      }));

    return {
      currency,
      revenueByCurrency,
      totals: {
        orders: Number(statusRow?.orders ?? 0),
        unitsSold: Number(statusRow?.unitsSold ?? 0),
        revenue: singleCurrency ? Number(revenueByCurrency[0]?.revenue ?? 0) : 0,
        pendingOrders: Number(statusRow?.pendingOrders ?? 0),
        processingOrders: Number(statusRow?.processingOrders ?? 0),
        shippedOrders: Number(statusRow?.shippedOrders ?? 0),
        deliveredOrders: Number(statusRow?.deliveredOrders ?? 0),
        cancelledOrders: Number(statusRow?.cancelledOrders ?? 0),
      },
      topProducts,
      source: 'db',
    };
  } catch (err) {
    console.error('[seller/reports]', err);
    return empty;
  }
}
