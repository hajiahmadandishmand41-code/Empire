import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
import { creditSellersForOrder } from '@/lib/finance/wallet';
import { recordAudit } from '@/lib/audit/log';
import { logger } from '@/lib/logger';
import { consumeOrderStockReservations, releaseOrderStockReservations, setSellerOrdersStatus, syncParentOrderStatus } from '@/lib/orders/order-engine';
import { canTransition } from '@/lib/orders/state-machine';

export const dynamic = 'force-dynamic';
const patchSchema = z.object({ status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']) });

export async function OPTIONS() { return jsonPreflight(); }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireAdminApi('orders.manage');
  if (!guard.ok) return guard.response;
  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('invalid_json', 'Invalid JSON', { status: 400 }); }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError('invalid_body', 'Invalid status', { status: 422, details: { issues: parsed.error.issues } });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const previous = await tx.order.findUnique({
        where: { id },
        select: { id: true, status: true, paymentStatus: true, paymentMethod: true, currency: true, total: true, items: { select: { productId: true, quantity: true } } },
      });
      if (!previous) return { previous: null, updated: null, restoredLines: 0 };

      const goingToCancel = parsed.data.status === 'cancelled' && previous.status !== 'cancelled';
      const settlingCod = parsed.data.status === 'delivered' && previous.paymentStatus === 'pending' && previous.paymentMethod === 'cod';
      if (goingToCancel && previous.status === 'delivered') throw new OrderTransitionError('invalid_transition', 'A delivered order cannot be cancelled — issue a refund instead.');
      if (goingToCancel && previous.paymentMethod !== 'cod' && previous.paymentStatus === 'paid') throw new OrderTransitionError('refund_required', 'A paid online order cannot be cancelled until a provider refund is completed.');
      if (parsed.data.status === 'delivered' && previous.paymentStatus !== 'paid' && !settlingCod) throw new OrderTransitionError('payment_required', 'Only paid orders can be marked as delivered. COD is settled at delivery.');
      if (!canTransition(previous.status, parsed.data.status)) throw new OrderTransitionError('invalid_transition', `Cannot change order from ${previous.status} to ${parsed.data.status}.`);

      const transitioned = await tx.order.updateMany({ where: { id, status: previous.status }, data: { status: parsed.data.status, ...(settlingCod ? { paymentStatus: 'paid' as const } : {}) } });
      if (transitioned.count === 0) throw new OrderTransitionError('conflict', 'Order status changed concurrently. Please refresh and retry.');

      if (settlingCod) {
        const codTxn = await tx.transaction.findFirst({ where: { orderId: previous.id, method: 'cod', status: 'pending' }, orderBy: { createdAt: 'desc' } });
        if (codTxn) await tx.transaction.update({ where: { id: codTxn.id }, data: { status: 'paid', paidAt: new Date() } });
        else await tx.transaction.create({ data: { orderId: previous.id, reference: `TXN-COD-${previous.id}-${Date.now().toString(36)}`, provider: 'cod', method: 'cod', status: 'paid', amount: previous.total, currency: previous.currency, paidAt: new Date() } });
        for (const item of previous.items) await tx.product.update({ where: { id: item.productId }, data: { salesCount: { increment: item.quantity } } });
        await consumeOrderStockReservations(tx, previous.id);
        await setSellerOrdersStatus(tx, previous.id, 'delivered');
      } else if (parsed.data.status === 'delivered') {
        await consumeOrderStockReservations(tx, previous.id);
        await setSellerOrdersStatus(tx, previous.id, 'delivered');
      } else if (goingToCancel) {
        const released = await releaseOrderStockReservations(tx, previous.id);
        if (!released.hadReservations) {
          for (const item of previous.items) {
            await tx.product.update({ where: { id: item.productId }, data: { stockQuantity: { increment: item.quantity }, salesCount: { decrement: item.quantity }, inStock: true } });
          }
        }
        await setSellerOrdersStatus(tx, previous.id, 'cancelled');
      } else {
        await setSellerOrdersStatus(tx, previous.id, parsed.data.status);
      }

      await syncParentOrderStatus(tx, previous.id);
      const updated = await tx.order.findUniqueOrThrow({ where: { id } });
      return { previous, updated, restoredLines: goingToCancel ? previous.items.length : 0 };
    });

    if (!result.previous || !result.updated) return jsonError('not_found', 'Order not found', { status: 404 });
    const { previous, updated, restoredLines } = result;
    const creditedSellerLines = updated.status === 'delivered' ? await creditSellersForOrder(updated.id) : 0;
    await recordAudit({ actor: { id: guard.user.id, role: guard.user.role }, action: 'order.status_change', entityType: 'order', entityId: updated.id, before: { status: previous.status }, after: { status: updated.status }, metadata: { creditedSellerLines, restoredLines }, req });
    return jsonOk({ id: updated.id, status: updated.status, creditedSellerLines, restoredLines });
  } catch (err) {
    if (err instanceof OrderTransitionError) return jsonError(err.code, err.message, { status: 409 });
    logger.error('admin.orders.patch_failed', { orderId: id, adminId: guard.user.id }, err);
    return jsonError('update_failed', 'Failed to update order', { status: 500 });
  }
}

class OrderTransitionError extends Error {
  constructor(public code: string, message: string) { super(message); }
}
