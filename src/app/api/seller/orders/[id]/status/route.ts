/** Seller-scoped order status endpoint. */
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import type { OrderStatus } from '@prisma/client';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import { logger } from '@/lib/logger';
import { consumeSellerOrderStockReservations, syncParentOrderStatus } from '@/lib/orders/order-engine';
import { canSellerTransition } from '@/lib/orders/state-machine';
import { creditSellerOrder } from '@/lib/finance/wallet';

export const dynamic = 'force-dynamic';
const patchSchema = z.object({ status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']) });

export async function OPTIONS() { return jsonPreflight(); }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  if (guard.user.role !== 'seller') return jsonError('forbidden', 'Use the admin order endpoint for administrative status changes.', { status: 403 });

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('invalid_json', 'Invalid JSON', { status: 400 }); }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError('invalid_body', 'Invalid status', { status: 422, details: { issues: parsed.error.issues } });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  const order = await prisma.order.findFirst({ where: { OR: [{ id }, { reference: id }] }, select: { id: true, paymentMethod: true, paymentStatus: true } });
  if (!order) return jsonError('not_found', 'Order not found', { status: 404 });

  try {
    const rows = await prisma.$queryRaw<Array<{ id: string; status: string }>>(Prisma.sql`
      SELECT "id", "status" FROM "SellerOrder" WHERE "orderId" = ${order.id} AND "sellerId" = ${guard.user.id} LIMIT 1
    `);
    const sellerOrder = rows[0];
    if (!sellerOrder) return jsonError('forbidden', 'You are not a seller for this order', { status: 403 });
    if (!canSellerTransition(sellerOrder.status as OrderStatus, parsed.data.status)) return jsonError('invalid_transition', 'Seller order status can only advance one step at a time.', { status: 409 });
    if (order.paymentMethod !== 'cod' && order.paymentStatus !== 'paid') return jsonError('payment_required', 'Online payment must be confirmed before the seller can process this order.', { status: 409 });

    await prisma.$transaction(async (tx) => {
      const transitioned = await tx.$executeRaw(Prisma.sql`
        UPDATE "SellerOrder" SET "status" = ${parsed.data.status}, "updatedAt" = NOW()
        WHERE "id" = ${sellerOrder.id} AND "status" = ${sellerOrder.status}
      `);
      if (Number(transitioned) === 0) throw new Error('SELLER_ORDER_CONCURRENT_CHANGE');

      if (parsed.data.status === 'delivered') {
        await consumeSellerOrderStockReservations(tx, order.id, guard.user.id);
        if (order.paymentMethod === 'cod') {
          const items = await tx.orderItem.findMany({ where: { orderId: order.id, product: { sellerId: guard.user.id } }, select: { productId: true, quantity: true } });
          for (const item of items) await tx.product.update({ where: { id: item.productId }, data: { salesCount: { increment: item.quantity } } });

          const remaining = await tx.$queryRaw<Array<{ count: number }>>(Prisma.sql`
            SELECT COUNT(*)::int AS "count" FROM "SellerOrder" WHERE "orderId" = ${order.id} AND "status" <> 'delivered'
          `);
          if ((remaining[0]?.count ?? 0) === 0) {
            const codTxn = await tx.transaction.findFirst({ where: { orderId: order.id, method: 'cod', status: 'pending' }, orderBy: { createdAt: 'desc' } });
            if (codTxn) await tx.transaction.update({ where: { id: codTxn.id }, data: { status: 'paid', paidAt: new Date() } });
            await tx.order.update({ where: { id: order.id }, data: { paymentStatus: 'paid' } });
          }
        }
      }

      await syncParentOrderStatus(tx, order.id);
    });

    const creditedSellerLines = parsed.data.status === 'delivered' ? await creditSellerOrder(sellerOrder.id) : 0;
    const updated = await prisma.$queryRaw<Array<{ status: string }>>(Prisma.sql`SELECT "status" FROM "SellerOrder" WHERE "id" = ${sellerOrder.id} LIMIT 1`);
    return jsonOk({ id: order.id, sellerStatus: updated[0]?.status ?? parsed.data.status, creditedSellerLines });
  } catch (err) {
    if (err instanceof Error && err.message === 'SELLER_ORDER_CONCURRENT_CHANGE') return jsonError('conflict', 'Seller order changed concurrently. Please retry.', { status: 409 });
    logger.error('seller.orders.status.patch_failed', { orderId: order.id, sellerId: guard.user.id }, err);
    return jsonError('update_failed', 'Failed to update seller order status', { status: 500 });
  }
}
