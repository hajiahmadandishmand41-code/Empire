/**
 * Orders queries — server-only.
 * Customer reads are order-scoped; seller reads are SellerOrder-scoped so a
 * seller never receives another seller's line items or totals from a
 * multi-seller order.
 */
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { mapOrder } from '@/lib/db-mappers';
import type { Order, OrderStatus } from '@/types';
import { Prisma } from '@prisma/client';

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
function normStatus(s?: string | null): OrderStatus | undefined {
  if (!s) return undefined;
  return (STATUSES as string[]).includes(s) ? (s as OrderStatus) : undefined;
}

export interface OrderListItem {
  id: string;
  reference: string;
  status: OrderStatus;
  paymentStatus: string;
  paymentMethod: string;
  itemCount: number;
  total: number;
  currency: string;
  createdAt: string;
}
export interface Paged<T> { items: T[]; total: number; page: number; pageSize: number; source: 'db' | 'empty'; }
export interface SellerOrderSummary { total: number; pending: number; confirmed: number; processing: number; shipped: number; delivered: number; cancelled: number; }

interface UserListArgs { userId: string; page?: number; pageSize?: number; status?: string; }
function mapOrderListItem(r: { id: string; reference: string; status: OrderStatus; paymentStatus: string; paymentMethod: string; itemCount: number; total: { toNumber(): number }; currency: string; createdAt: Date; }): OrderListItem {
  return { id: r.id, reference: r.reference, status: r.status, paymentStatus: r.paymentStatus, paymentMethod: r.paymentMethod, itemCount: r.itemCount, total: r.total.toNumber(), currency: r.currency, createdAt: r.createdAt.toISOString() };
}

const sellerOrderSelect = { id: true, reference: true, status: true, paymentStatus: true, paymentMethod: true, itemCount: true, total: true, currency: true, createdAt: true } as const;

export async function listUserOrders(args: UserListArgs): Promise<Paged<OrderListItem>> {
  const page = Math.max(1, args.page ?? 1);
  const pageSize = Math.min(50, Math.max(5, args.pageSize ?? 10));
  const status = normStatus(args.status);
  if (!isDatabaseConfigured()) return { items: [], total: 0, page, pageSize, source: 'empty' };
  const where = { userId: args.userId, ...(status ? { status } : {}) };
  const [rows, total] = await Promise.all([
    prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize, select: sellerOrderSelect }),
    prisma.order.count({ where }),
  ]);
  return { items: rows.map(mapOrderListItem), total, page, pageSize, source: 'db' };
}

interface SellerListArgs { sellerId: string; page?: number; pageSize?: number; status?: string; q?: string; }

export async function listSellerOrders(args: SellerListArgs): Promise<Paged<OrderListItem>> {
  const page = Math.max(1, args.page ?? 1);
  const pageSize = Math.min(50, Math.max(5, args.pageSize ?? 10));
  if (!isDatabaseConfigured()) return { items: [], total: 0, page, pageSize, source: 'empty' };
  const status = normStatus(args.status);
  const q = args.q?.trim() ?? '';
  const offset = (page - 1) * pageSize;
  const statusSql = status ? Prisma.sql`AND so."status" = ${status}` : Prisma.empty;
  const querySql = q ? Prisma.sql`AND (o."reference" ILIKE ${`%${q}%`} OR o."shippingFullName" ILIKE ${`%${q}%`})` : Prisma.empty;
  const rows = await prisma.$queryRaw<Array<{ id: string; reference: string; status: string; paymentStatus: string; paymentMethod: string; itemCount: number; total: Prisma.Decimal; currency: string; createdAt: Date }>>(Prisma.sql`
    SELECT so."id", o."reference", so."status", o."paymentStatus", o."paymentMethod",
           so."itemCount", so."total", so."currency", o."createdAt"
    FROM "SellerOrder" so
    JOIN "Order" o ON o."id" = so."orderId"
    WHERE so."sellerId" = ${args.sellerId}
      ${statusSql}
      ${querySql}
    ORDER BY o."createdAt" DESC, so."id" ASC
    OFFSET ${offset} LIMIT ${pageSize}
  `);
  const countRows = await prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
    SELECT COUNT(*)::int AS "count"
    FROM "SellerOrder" so
    JOIN "Order" o ON o."id" = so."orderId"
    WHERE so."sellerId" = ${args.sellerId}
      ${statusSql}
      ${querySql}
  `);
  return {
    items: rows.map((r) => ({ id: r.id, reference: r.reference, status: r.status as OrderStatus, paymentStatus: r.paymentStatus, paymentMethod: r.paymentMethod, itemCount: r.itemCount, total: new Prisma.Decimal(r.total).toNumber(), currency: r.currency, createdAt: new Date(r.createdAt).toISOString() })),
    total: countRows[0]?.count ?? 0,
    page,
    pageSize,
    source: 'db',
  };
}

export async function getSellerOrderSummary(sellerId: string): Promise<SellerOrderSummary> {
  const empty: SellerOrderSummary = { total: 0, pending: 0, confirmed: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
  if (!isDatabaseConfigured()) return empty;
  const rows = await prisma.$queryRaw<Array<{ status: string; count: number }>>(Prisma.sql`
    SELECT "status", COUNT(*)::int AS "count" FROM "SellerOrder" WHERE "sellerId" = ${sellerId} GROUP BY "status"
  `);
  const summary: SellerOrderSummary = { ...empty };
  for (const row of rows) {
    if (row.status in summary) summary[row.status as keyof SellerOrderSummary] = row.count;
  }
  summary.total = rows.reduce((sum, row) => sum + row.count, 0);
  return summary;
}

export async function getOrderForViewer(
  ref: string,
  viewer: { id: string; role: 'customer' | 'seller' | 'admin' } | null,
): Promise<{ order: Order; totals: { subtotal: number; shipping: number; total: number } } | null> {
  if (!isDatabaseConfigured()) return null;
  const row = await prisma.order.findFirst({
    where: { OR: [{ id: ref }, { reference: ref }] },
    include: { items: { include: { product: true } }, address: true, shippingMethod: true },
  });
  if (!row) return null;

  if (viewer?.role === 'seller') {
    const sellerRows = await prisma.$queryRaw<Array<{ id: string; status: string; subtotal: Prisma.Decimal; shipping: Prisma.Decimal; total: Prisma.Decimal; itemCount: number }>>(Prisma.sql`
      SELECT "id", "status", "subtotal", "shipping", "total", "itemCount"
      FROM "SellerOrder"
      WHERE "orderId" = ${row.id} AND "sellerId" = ${viewer.id}
      LIMIT 1
    `);
    const sellerOrder = sellerRows[0];
    if (!sellerOrder) return null;
    const sellerItems = row.items.filter((item) => item.product?.sellerId === viewer.id);
    const mapped = mapOrder(row);
    const sellerProductIds = new Set(sellerItems.map((source) => source.productId));
    mapped.items = mapped.items.filter((item) => Boolean(item.productId && sellerProductIds.has(item.productId)));
    mapped.itemCount = sellerOrder.itemCount;
    mapped.subtotal = new Prisma.Decimal(sellerOrder.subtotal).toNumber();
    mapped.shipping = new Prisma.Decimal(sellerOrder.shipping).toNumber();
    mapped.total = new Prisma.Decimal(sellerOrder.total).toNumber();
    mapped.status = sellerOrder.status as OrderStatus;
    return { order: mapped, totals: { subtotal: mapped.subtotal ?? 0, shipping: mapped.shipping ?? 0, total: mapped.total ?? 0 } };
  }

  const isOwner = Boolean(viewer && row.userId && row.userId === viewer.id);
  const isAdmin = viewer?.role === 'admin';
  if (!isOwner && !isAdmin) return null;
  const mapped = mapOrder(row);
  return { order: mapped, totals: { subtotal: row.subtotal.toNumber(), shipping: row.shipping.toNumber(), total: row.total.toNumber() } };
}
