import type { NextRequest } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';
import { getCurrentUser } from '@/lib/auth/current-user';
import { releaseOrderStockReservations, syncParentOrderStatus } from '@/lib/orders/order-engine';
import { canCustomerCancel } from '@/lib/orders/state-machine';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return jsonPreflight();
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rl = await rateLimitAsync(clientKey(req, 'orders:cancel'), { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });

  const user = await getCurrentUser();
  if (!user) return jsonError('unauthorized', 'Authentication required', { status: 401 });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  const { id } = await params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { OR: [{ id }, { reference: id }], userId: user.id },
        select: { id: true, status: true, paymentStatus: true, paymentMethod: true },
      });
      if (!order) throw new CancelError('not_found', 'Order not found');
      if (!canCustomerCancel(order.status)) throw new CancelError('invalid_transition', 'This order can no longer be cancelled.');

      if (order.paymentMethod !== 'cod' && order.paymentStatus === 'paid') {
        throw new CancelError('refund_required', 'A paid online order requires a completed refund before cancellation.');
      }

      const transitioned = await tx.order.updateMany({
        where: { id: order.id, userId: user.id, status: order.status, paymentStatus: order.paymentStatus },
        data: { status: 'cancelled' },
      });
      if (transitioned.count === 0) throw new CancelError('conflict', 'Order changed concurrently. Please retry.');

      await releaseOrderStockReservations(tx, order.id);
      await tx.$executeRaw`
        UPDATE "SellerOrder"
        SET "status" = 'cancelled', "updatedAt" = NOW()
        WHERE "orderId" = ${order.id}
          AND "status" NOT IN ('delivered','cancelled','refunded')
      `;

      await syncParentOrderStatus(tx, order.id);
      const updated = await tx.order.findUniqueOrThrow({ where: { id: order.id } });
      return updated;
    });

    return jsonOk({ id: result.id, reference: result.reference, status: result.status });
  } catch (error) {
    if (error instanceof CancelError) {
      const status = error.code === 'not_found' ? 404 : error.code === 'conflict' || error.code === 'refund_required' || error.code === 'invalid_transition' ? 409 : 422;
      return jsonError(error.code, error.message, { status });
    }
    logger.error('orders.cancel_failed', { orderId: id, userId: user.id }, error);
    return jsonError('cancel_failed', 'Failed to cancel order', { status: 500 });
  }
}

class CancelError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}
