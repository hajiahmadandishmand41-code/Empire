import { Prisma } from '@prisma/client';
import { prisma, isDatabaseConfigured } from '@/lib/db';

export interface SellerCustomerRow {
  key: string;
  name: string;
  phone: string;
  orders: number;
  totalSpent: number;
  lastOrder: string;
}

export interface SellerCustomerPage {
  rows: SellerCustomerRow[];
  totalCustomers: number;
  page: number;
  pageSize: number;
}

export async function listSellerCustomers(args: {
  sellerId: string;
  page?: number;
  pageSize?: number;
  q?: string;
}): Promise<SellerCustomerPage> {
  const page = Math.max(1, args.page ?? 1);
  const pageSize = Math.min(50, Math.max(10, args.pageSize ?? 20));
  if (!isDatabaseConfigured()) return { rows: [], totalCustomers: 0, page, pageSize };

  const offset = (page - 1) * pageSize;
  const q = args.q?.trim() ?? '';
  const like = `%${q.replace(/[%_\\]/g, '\\$&')}%`;

  const rows = await prisma.$queryRaw<Array<{
    customer_key: string;
    name: string | null;
    phone: string | null;
    order_count: bigint;
    total_spent: Prisma.Decimal;
    last_order: Date;
  }>>(Prisma.sql`
    WITH seller_orders AS (
      SELECT DISTINCT
        o.id,
        o."userId",
        o."shippingPhone",
        o."shippingFullName",
        o."total",
        o."createdAt"
      FROM "Order" o
      JOIN "OrderItem" oi ON oi."orderId" = o.id
      JOIN "Product" p ON p.id = oi."productId"
      WHERE p."sellerId" = ${args.sellerId}
    ),
    customer_rollup AS (
      SELECT
        COALESCE("userId", 'guest:' || COALESCE("shippingPhone", "shippingFullName", id)) AS customer_key,
        MAX("shippingFullName") AS name,
        MAX("shippingPhone") AS phone,
        COUNT(*)::bigint AS order_count,
        COALESCE(SUM("total"), 0) AS total_spent,
        MAX("createdAt") AS last_order
      FROM seller_orders
      GROUP BY COALESCE("userId", 'guest:' || COALESCE("shippingPhone", "shippingFullName", id))
    )
    SELECT customer_key, name, phone, order_count, total_spent, last_order
    FROM customer_rollup
    WHERE ${q === '' ? Prisma.sql`TRUE` : Prisma.sql`(
      COALESCE(name, '') ILIKE ${like} ESCAPE '\\'
      OR COALESCE(phone, '') ILIKE ${like} ESCAPE '\\'
      OR customer_key ILIKE ${like} ESCAPE '\\'
    )`}
    ORDER BY last_order DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `);

  const count = await prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
    WITH seller_orders AS (
      SELECT DISTINCT o.id, o."userId", o."shippingPhone", o."shippingFullName", o."createdAt"
      FROM "Order" o
      JOIN "OrderItem" oi ON oi."orderId" = o.id
      JOIN "Product" p ON p.id = oi."productId"
      WHERE p."sellerId" = ${args.sellerId}
    )
    SELECT COUNT(*)::bigint AS count
    FROM (
      SELECT COALESCE("userId", 'guest:' || COALESCE("shippingPhone", "shippingFullName", id)) AS customer_key,
             MAX("shippingFullName") AS name,
             MAX("shippingPhone") AS phone
      FROM seller_orders
      GROUP BY COALESCE("userId", 'guest:' || COALESCE("shippingPhone", "shippingFullName", id))
    ) customer_rollup
    WHERE ${q === '' ? Prisma.sql`TRUE` : Prisma.sql`(
      COALESCE(name, '') ILIKE ${like} ESCAPE '\\'
      OR COALESCE(phone, '') ILIKE ${like} ESCAPE '\\'
      OR customer_key ILIKE ${like} ESCAPE '\\'
    )`}
  `);

  return {
    rows: rows.map((row) => ({
      key: row.customer_key,
      name: row.name ?? 'مشتری',
      phone: row.phone ?? '—',
      orders: Number(row.order_count),
      totalSpent: Number(row.total_spent),
      lastOrder: row.last_order.toISOString(),
    })),
    totalCustomers: Number(count[0]?.count ?? 0),
    page,
    pageSize,
  };
}
