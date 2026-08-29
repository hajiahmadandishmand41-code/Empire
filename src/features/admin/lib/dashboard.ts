import { prisma, isDatabaseConfigured } from '@/lib/db';

type Numeric = number | string | bigint;
type SummaryRow = { today: Numeric; week: Numeric; month: Numeric; revenue: Numeric; totalOrders: Numeric; newOrders: Numeric; users: Numeric; sellers: Numeric; products: Numeric; inactiveProducts: Numeric; lowStock: Numeric; pendingSellers: Numeric; avgOrderValue: Numeric };
type SalesRow = { date: string; orders: Numeric; revenue: Numeric };
type NameMetricRow = { name: string; units: Numeric; revenue: Numeric };
export type DashboardLowStock = { id: string; name: string; stockQuantity: number; isActive: boolean };
export type DashboardOrder = { id: string; reference: string; status: string; paymentStatus: string; total: number; currency: string; createdAt: Date; address: { fullName: string } };
export type DashboardMetric = { name: string; units: number; revenue: number };
export type AdminDashboardMetrics = { today: number; week: number; month: number; revenue: number; totalOrders: number; newOrders: number; users: number; sellerCount: number; products: number; inactiveProducts: number; lowStockCount: number; pendingSellers: number; avgOrderValue: number; currency: string; salesByDay: Array<{ date: string; orders: number; revenue: number }>; lowStock: DashboardLowStock[]; recentOrders: DashboardOrder[]; topProducts: DashboardMetric[]; topCategories: DashboardMetric[]; topSellers: DashboardMetric[] };

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  if (!isDatabaseConfigured()) throw new Error('Database not configured');

  const currencyRows = await prisma.$queryRaw<Array<{ currency: string }>>`
    SELECT "currency" FROM "Order" WHERE status <> 'cancelled'
    GROUP BY "currency" ORDER BY COUNT(*) DESC, MAX("createdAt") DESC LIMIT 1
  `;
  const currency = currencyRows[0]?.currency ?? 'AFN';

  const [summary, sales, lowStock, recentOrders, topProducts, topCategories, topSellers] = await Promise.all([
    prisma.$queryRaw<Array<SummaryRow>>`
      SELECT
        COALESCE(SUM(CASE WHEN o."createdAt" >= CURRENT_DATE THEN o.total ELSE 0 END),0) AS today,
        COALESCE(SUM(CASE WHEN o."createdAt" >= CURRENT_DATE-INTERVAL '6 day' THEN o.total ELSE 0 END),0) AS week,
        COALESCE(SUM(CASE WHEN o."createdAt" >= date_trunc('month',CURRENT_DATE) THEN o.total ELSE 0 END),0) AS month,
        COALESCE(SUM(o.total),0) AS revenue,
        COUNT(*) AS "totalOrders",
        COUNT(*) FILTER (WHERE o.status = 'pending') AS "newOrders",
        (SELECT COUNT(*) FROM "User" WHERE role = 'customer') AS users,
        (SELECT COUNT(*) FROM "User" WHERE role = 'seller') AS sellers,
        (SELECT COUNT(*) FROM "Product") AS products,
        (SELECT COUNT(*) FROM "Product" WHERE "isActive" = false) AS "inactiveProducts",
        (SELECT COUNT(*) FROM "Product" WHERE "isActive" = true AND "stockQuantity" <= 5) AS "lowStock",
        (SELECT COUNT(*) FROM "User" WHERE role = 'seller' AND "sellerStatus" = 'pending') AS "pendingSellers",
        COALESCE(AVG(o.total),0) AS "avgOrderValue"
      FROM "Order" o WHERE o.status <> 'cancelled' AND o."currency" = ${currency}
    `,
    prisma.$queryRaw<Array<SalesRow>>`
      SELECT TO_CHAR(DATE_TRUNC('day',"createdAt"),'YYYY-MM-DD') AS date,
             COUNT(*) AS orders, COALESCE(SUM(total),0) AS revenue
      FROM "Order"
      WHERE "createdAt" >= CURRENT_DATE-INTERVAL '29 day' AND status <> 'cancelled' AND "currency" = ${currency}
      GROUP BY 1 ORDER BY 1 ASC
    `,
    prisma.product.findMany({ where: { isActive: true, stockQuantity: { lte: 5 } }, select: { id: true, name: true, stockQuantity: true, isActive: true }, orderBy: { stockQuantity: 'asc' }, take: 5 }),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 6, select: { id: true, reference: true, status: true, paymentStatus: true, total: true, currency: true, createdAt: true, address: { select: { fullName: true } } } }),
    prisma.$queryRaw<Array<NameMetricRow>>`SELECT oi.name, SUM(oi.quantity)::bigint AS units, COALESCE(SUM(oi.price*oi.quantity),0) AS revenue FROM "OrderItem" oi JOIN "Order" o ON o.id=oi."orderId" WHERE o.status<>'cancelled' AND o."currency"=${currency} GROUP BY oi.name ORDER BY units DESC LIMIT 5`,
    prisma.$queryRaw<Array<NameMetricRow>>`SELECT c.name, SUM(oi.quantity)::bigint AS units, COALESCE(SUM(oi.price*oi.quantity),0) AS revenue FROM "OrderItem" oi JOIN "Order" o ON o.id=oi."orderId" JOIN "Product" p ON p.id=oi."productId" JOIN "Category" c ON c.id=p."categoryId" WHERE o.status<>'cancelled' AND o."currency"=${currency} GROUP BY c.id,c.name ORDER BY revenue DESC LIMIT 5`,
    prisma.$queryRaw<Array<NameMetricRow>>`SELECT COALESCE(u."sellerShopName",u."fullName") AS name, SUM(oi.quantity)::bigint AS units, COALESCE(SUM(oi.price*oi.quantity),0) AS revenue FROM "OrderItem" oi JOIN "Order" o ON o.id=oi."orderId" JOIN "Product" p ON p.id=oi."productId" JOIN "User" u ON u.id=p."sellerId" WHERE o.status<>'cancelled' AND o."currency"=${currency} AND p."sellerId" IS NOT NULL GROUP BY u.id,u."sellerShopName",u."fullName" ORDER BY revenue DESC LIMIT 5`,
  ]);

  const s = summary[0] ?? ({} as SummaryRow);
  return {
    today: Number(s.today ?? 0), week: Number(s.week ?? 0), month: Number(s.month ?? 0), revenue: Number(s.revenue ?? 0),
    totalOrders: Number(s.totalOrders ?? 0), newOrders: Number(s.newOrders ?? 0), users: Number(s.users ?? 0), sellerCount: Number(s.sellers ?? 0),
    products: Number(s.products ?? 0), inactiveProducts: Number(s.inactiveProducts ?? 0), lowStockCount: Number(s.lowStock ?? 0), pendingSellers: Number(s.pendingSellers ?? 0),
    avgOrderValue: Number(s.avgOrderValue ?? 0), currency,
    salesByDay: sales.map((r) => ({ date: r.date, orders: Number(r.orders), revenue: Number(r.revenue ?? 0) })),
    lowStock: lowStock.map((p) => ({ id: p.id, name: p.name, stockQuantity: p.stockQuantity, isActive: p.isActive })), recentOrders: recentOrders.map((o) => ({ ...o, total: Number(o.total) })),
    topProducts: topProducts.map((r) => ({ name: r.name, units: Number(r.units), revenue: Number(r.revenue ?? 0) })), topCategories: topCategories.map((r) => ({ name: r.name, units: Number(r.units), revenue: Number(r.revenue ?? 0) })), topSellers: topSellers.map((r) => ({ name: r.name, units: Number(r.units), revenue: Number(r.revenue ?? 0) })),
  };
}
