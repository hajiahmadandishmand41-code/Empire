import { prisma, isDatabaseConfigured } from '@/lib/db';

type Numeric = number | string | bigint;
type SummaryRow = { today: Numeric; week: Numeric; month: Numeric; revenue: Numeric; totalOrders: Numeric; newOrders: Numeric; users: Numeric; sellers: Numeric; products: Numeric; inactiveProducts: Numeric; lowStock: Numeric; pendingSellers: Numeric; avgOrderValue: Numeric };
type SalesRow = { date: string; orders: Numeric; revenue: Numeric };
type NameMetricRow = { name: string; units: Numeric; revenue: Numeric };

export async function getAdminDashboardMetrics() {
  if (!isDatabaseConfigured()) throw new Error('Database not configured');

  const [summary, sales, lowStock, recentOrders, topProducts, topSellers] = await Promise.all([
    prisma.$queryRawUnsafe<SummaryRow[]>(`SELECT COALESCE(SUM(CASE WHEN o."createdAt">=CURRENT_DATE AND o.status<>'cancelled' THEN o.total ELSE 0 END),0) AS today, COALESCE(SUM(CASE WHEN o."createdAt">=CURRENT_DATE-INTERVAL '6 day' AND o.status<>'cancelled' THEN o.total ELSE 0 END),0) AS week, COALESCE(SUM(CASE WHEN o."createdAt">=date_trunc('month',CURRENT_DATE) AND o.status<>'cancelled' THEN o.total ELSE 0 END),0) AS month, COALESCE(SUM(CASE WHEN o.status<>'cancelled' THEN o.total ELSE 0 END),0) AS revenue, COUNT(*) AS "totalOrders", COUNT(*) FILTER(WHERE o.status='pending') AS "newOrders", (SELECT COUNT(*) FROM "User") AS users, (SELECT COUNT(*) FROM "User" WHERE role='seller') AS sellers, (SELECT COUNT(*) FROM "Product") AS products, (SELECT COUNT(*) FROM "Product" WHERE "isActive"=false) AS "inactiveProducts", (SELECT COUNT(*) FROM "Product" WHERE "stockQuantity"<=5) AS "lowStock", (SELECT COUNT(*) FROM "User" WHERE "sellerStatus"='pending') AS "pendingSellers", COALESCE(AVG(o.total) FILTER(WHERE o.status<>'cancelled'),0) AS "avgOrderValue" FROM "Order" o`),
    prisma.$queryRawUnsafe<SalesRow[]>(`SELECT TO_CHAR(DATE_TRUNC('day',"createdAt"),'YYYY-MM-DD') AS date, COUNT(*) FILTER(WHERE status<>'cancelled') AS orders, COALESCE(SUM(total) FILTER(WHERE status<>'cancelled'),0) AS revenue FROM "Order" WHERE "createdAt">=CURRENT_DATE-INTERVAL '29 day' GROUP BY 1 ORDER BY 1 ASC`),
    prisma.product.findMany({ where: { stockQuantity: { lte: 5 } }, select: { id: true, name: true, stockQuantity: true, isActive: true }, orderBy: { stockQuantity: 'asc' }, take: 5 }),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 6, select: { id: true, reference: true, status: true, paymentStatus: true, total: true, currency: true, createdAt: true, address: { select: { fullName: true } } } }),
    prisma.$queryRawUnsafe<NameMetricRow[]>(`SELECT oi.name,SUM(oi.quantity)::bigint AS units,COALESCE(SUM(oi.price*oi.quantity),0) AS revenue FROM "OrderItem" oi JOIN "Order" o ON o.id=oi."orderId" WHERE o.status<>'cancelled' GROUP BY oi.name ORDER BY units DESC LIMIT 5`),
    prisma.$queryRawUnsafe<NameMetricRow[]>(`SELECT COALESCE(u."sellerShopName",u."fullName") AS name,SUM(oi.quantity)::bigint AS units,COALESCE(SUM(oi.price*oi.quantity),0) AS revenue FROM "OrderItem" oi JOIN "Order" o ON o.id=oi."orderId" JOIN "Product" p ON p.id=oi."productId" JOIN "User" u ON u.id=p."sellerId" WHERE o.status<>'cancelled' AND p."sellerId" IS NOT NULL GROUP BY u.id,u."sellerShopName",u."fullName" ORDER BY revenue DESC LIMIT 5`),
  ]);

  const s = summary[0] ?? ({} as SummaryRow);
  return {
    today: Number(s.today ?? 0),
    week: Number(s.week ?? 0),
    month: Number(s.month ?? 0),
    revenue: Number(s.revenue ?? 0),
    totalOrders: Number(s.totalOrders ?? 0),
    newOrders: Number(s.newOrders ?? 0),
    users: Number(s.users ?? 0),
    sellerCount: Number(s.sellers ?? 0),
    products: Number(s.products ?? 0),
    inactiveProducts: Number(s.inactiveProducts ?? 0),
    lowStockCount: Number(s.lowStock ?? 0),
    pendingSellers: Number(s.pendingSellers ?? 0),
    avgOrderValue: Number(s.avgOrderValue ?? 0),
    currency: 'AFN',
    salesByDay: sales.map((r) => ({ date: r.date, orders: Number(r.orders), revenue: Number(r.revenue ?? 0) })),
    pendingProducts: [],
    lowStock,
    sellers: [],
    recentOrders: recentOrders.map((o) => { const { total, ...order } = o; return { ...order, total: Number(total) }; }),
    topProducts: topProducts.map((r) => ({ name: r.name, units: Number(r.units), revenue: Number(r.revenue ?? 0) })),
    topCategories: [],
    topSellers: topSellers.map((r) => ({ name: r.name, units: Number(r.units), revenue: Number(r.revenue ?? 0) })),
  };
}
