/** Seller data queries — server-only Prisma helpers. */
import { prisma, isDatabaseConfigured } from '@/lib/db';

export interface SellerStatsResult {
  products: number;
  orders: number;
  activeProducts: number;
  outOfStockProducts: number;
  revenue: number;
  currency: string;
  pendingOrders: number;
  source: 'db';
}

export async function getSellerStats(sellerId?: string): Promise<SellerStatsResult> {
  if (!isDatabaseConfigured()) throw new Error('Database not configured');

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
      select: { orderId: true, price: true, quantity: true, order: { select: { status: true, currency: true } } },
    });
    const orderIds = new Set<string>();
    const seen = new Set<string>();
    for (const item of items) {
      orderIds.add(item.orderId);
      currency = item.order.currency || currency;
      if (item.order.status !== 'cancelled') revenue += item.price.toNumber() * item.quantity;
      if (!seen.has(item.orderId)) {
        seen.add(item.orderId);
        if (item.order.status === 'pending' || item.order.status === 'confirmed') pendingOrders += 1;
      }
    }
    orders = orderIds.size;
  } else {
    orders = await prisma.order.count();
  }

  return { products, orders, activeProducts, outOfStockProducts, revenue, currency, pendingOrders, source: 'db' };
}
