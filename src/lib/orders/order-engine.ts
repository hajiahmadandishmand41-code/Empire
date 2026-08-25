import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

export const ONLINE_RESERVATION_MINUTES = 15;
export const MANUAL_PAYMENT_RESERVATION_MINUTES = 60;
export const COD_RESERVATION_MINUTES = 48 * 60;

type Tx = Prisma.TransactionClient | PrismaClient;

function id(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}

export async function releaseExpiredStockReservations(tx: Tx): Promise<number> {
  const rows = await tx.$queryRaw<Array<{ productId: string; quantity: number }>>(Prisma.sql`
    WITH expired AS (
      SELECT "id", "productId", "quantity"
      FROM "StockReservation"
      WHERE "status" = 'reserved' AND "expiresAt" <= NOW()
      FOR UPDATE SKIP LOCKED
    ),
    marked AS (
      UPDATE "StockReservation" r
      SET "status" = 'expired', "releasedAt" = NOW(), "updatedAt" = NOW()
      FROM expired e
      WHERE r."id" = e."id" AND r."status" = 'reserved'
      RETURNING r."productId", r."quantity"
    )
    SELECT "productId", SUM("quantity")::int AS "quantity"
    FROM marked
    GROUP BY "productId"
  `);
  for (const row of rows) {
    await tx.$executeRaw(Prisma.sql`UPDATE "Product" SET "stockQuantity" = "stockQuantity" + ${row.quantity}, "inStock" = true WHERE "id" = ${row.productId}`);
  }
  return rows.reduce((sum, row) => sum + row.quantity, 0);
}

export async function releaseOrderStockReservations(tx: Tx, orderId: string): Promise<{ quantity: number; hadReservations: boolean }> {
  const rows = await tx.$queryRaw<Array<{ productId: string; quantity: number }>>(Prisma.sql`
    WITH marked AS (
      UPDATE "StockReservation"
      SET "status" = 'released', "releasedAt" = NOW(), "updatedAt" = NOW()
      WHERE "orderId" = ${orderId} AND "status" = 'reserved'
      RETURNING "productId", "quantity"
    )
    SELECT "productId", SUM("quantity")::int AS "quantity"
    FROM marked
    GROUP BY "productId"
  `);
  for (const row of rows) {
    await tx.$executeRaw(Prisma.sql`UPDATE "Product" SET "stockQuantity" = "stockQuantity" + ${row.quantity}, "inStock" = true WHERE "id" = ${row.productId}`);
  }
  return { quantity: rows.reduce((sum, row) => sum + row.quantity, 0), hadReservations: rows.length > 0 };
}

export async function consumeOrderStockReservations(tx: Tx, orderId: string): Promise<number> {
  const result = await tx.$executeRaw(Prisma.sql`
    UPDATE "StockReservation" SET "status" = 'consumed', "updatedAt" = NOW()
    WHERE "orderId" = ${orderId} AND "status" = 'reserved'
  `);
  return Number(result);
}

export async function createOrderStockReservations(tx: Tx, orderId: string, expiresInMinutes: number): Promise<void> {
  const items = await tx.$queryRaw<Array<{ id: string; productId: string; quantity: number }>>(Prisma.sql`
    SELECT "id", "productId", "quantity" FROM "OrderItem" WHERE "orderId" = ${orderId} ORDER BY "id" ASC
  `);
  for (const item of items) {
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "StockReservation" ("id", "orderId", "orderItemId", "productId", "quantity", "status", "expiresAt")
      VALUES (${id('sr')}, ${orderId}, ${item.id}, ${item.productId}, ${item.quantity}, 'reserved', NOW() + make_interval(mins => ${expiresInMinutes}))
      ON CONFLICT ("orderItemId") DO NOTHING
    `);
  }
}

export async function createSellerOrders(tx: Tx, orderId: string, shipping: Prisma.Decimal, currency: string): Promise<void> {
  const groups = await tx.$queryRaw<Array<{ sellerId: string; commissionRate: Prisma.Decimal; subtotal: Prisma.Decimal; itemCount: number }>>(Prisma.sql`
    SELECT p."sellerId" AS "sellerId", u."commissionRate" AS "commissionRate",
           SUM(oi."price" * oi."quantity") AS "subtotal", SUM(oi."quantity")::int AS "itemCount"
    FROM "OrderItem" oi
    JOIN "Product" p ON p."id" = oi."productId"
    JOIN "User" u ON u."id" = p."sellerId"
    WHERE oi."orderId" = ${orderId} AND p."sellerId" IS NOT NULL
    GROUP BY p."sellerId", u."commissionRate"
    ORDER BY p."sellerId" ASC
  `);
  if (groups.length === 0) return;
  const totalSubtotal = groups.reduce((sum, g) => sum.add(new Prisma.Decimal(g.subtotal)), new Prisma.Decimal(0));
  let allocatedShipping = new Prisma.Decimal(0);
  for (let index = 0; index < groups.length; index += 1) {
    const group = groups[index];
    const subtotal = new Prisma.Decimal(group.subtotal).toDecimalPlaces(2);
    const commissionRate = new Prisma.Decimal(group.commissionRate ?? 10);
    const commission = subtotal.mul(commissionRate).div(100).toDecimalPlaces(2);
    const sellerShipping = index === groups.length - 1
      ? shipping.sub(allocatedShipping).toDecimalPlaces(2)
      : totalSubtotal.gt(0) ? shipping.mul(subtotal).div(totalSubtotal).toDecimalPlaces(2) : new Prisma.Decimal(0);
    allocatedShipping = allocatedShipping.add(sellerShipping);
    const total = subtotal.add(sellerShipping).toDecimalPlaces(2);
    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "SellerOrder" ("id", "orderId", "sellerId", "status", "subtotal", "shipping", "commission", "total", "currency", "itemCount")
      VALUES (${id('so')}, ${orderId}, ${group.sellerId}, 'pending', ${subtotal}, ${sellerShipping}, ${commission}, ${total}, ${currency}, ${group.itemCount})
      ON CONFLICT ("orderId", "sellerId") DO UPDATE SET
        "subtotal" = EXCLUDED."subtotal", "shipping" = EXCLUDED."shipping", "commission" = EXCLUDED."commission",
        "total" = EXCLUDED."total", "currency" = EXCLUDED."currency", "itemCount" = EXCLUDED."itemCount", "updatedAt" = NOW()
    `);
  }
}

export async function setSellerOrdersStatus(tx: Tx, orderId: string, status: string): Promise<void> {
  await tx.$executeRaw(Prisma.sql`
    UPDATE "SellerOrder" SET "status" = ${status}, "updatedAt" = NOW()
    WHERE "orderId" = ${orderId} AND "status" NOT IN ('delivered', 'cancelled', 'refunded')
  `);
}

export async function setSellerOrderStatus(tx: Tx, orderId: string, sellerId: string, status: string): Promise<number> {
  const result = await tx.$executeRaw(Prisma.sql`
    UPDATE "SellerOrder" SET "status" = ${status}, "updatedAt" = NOW()
    WHERE "orderId" = ${orderId} AND "sellerId" = ${sellerId}
  `);
  return Number(result);
}

export async function syncParentOrderStatus(tx: Tx, orderId: string): Promise<string | null> {
  const rows = await tx.$queryRaw<Array<{ status: string; count: number }>>(Prisma.sql`
    SELECT "status", COUNT(*)::int AS "count" FROM "SellerOrder" WHERE "orderId" = ${orderId} GROUP BY "status"
  `);
  if (rows.length === 0) return null;
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const count = (status: string) => rows.find((row) => row.status === status)?.count ?? 0;
  let next = 'pending';
  if (count('cancelled') === total) next = 'cancelled';
  else if (count('delivered') === total) next = 'delivered';
  else if (count('shipped') > 0) next = 'shipped';
  else if (count('processing') > 0) next = 'processing';
  else if (count('confirmed') > 0) next = 'confirmed';
  else if (count('refunded') === total) next = 'cancelled';
  await tx.$executeRaw(Prisma.sql`UPDATE "Order" SET "status" = ${next}, "updatedAt" = NOW() WHERE "id" = ${orderId}`);
  return next;
}

export async function sellerOrderBelongsToSeller(tx: Tx, orderId: string, sellerId: string): Promise<boolean> {
  const rows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id" FROM "SellerOrder" WHERE "orderId" = ${orderId} AND "sellerId" = ${sellerId} LIMIT 1
  `);
  return rows.length > 0;
}
