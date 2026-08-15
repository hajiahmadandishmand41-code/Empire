/**
 * Payment domain helpers. Owns the mapping from a provider payment
 * result to Order.status / Order.paymentStatus, in one place.
 */
import { prisma } from '@/lib/db';
import type {
  Order as POrder,
  Transaction as PTransaction,
  PaymentStatus as PPaymentStatus,
  OrderStatus as POrderStatus,
} from '@prisma/client';
import { reverseSellersForOrder } from '@/lib/finance/wallet';
import { logger } from '@/lib/logger';

/**
 * Apply a payment result to an order + transaction inside a single
 * transaction so status changes stay consistent.
 *
 *  - paid       -> order.paymentStatus=paid, order.status=confirmed
 *  - failed     -> order.paymentStatus=failed (order status untouched)
 *  - cancelled  -> order.paymentStatus=cancelled
 *  - refunded   -> order.paymentStatus=refunded; if the order was
 *                  already delivered, reverse seller wallet credits.
 *  - pending    -> no-op
 *
 * Idempotency: once a transaction row reaches a terminal state
 * (paid/failed/cancelled/refunded) the same call becomes a no-op,
 * even under concurrent webhook + return-URL races. The state check
 * and update are performed atomically via `updateMany` with a
 * conditional `where`, so two callers cannot both pass the guard.
 */
export async function applyPaymentResult(params: {
  transactionId: string;
  status: PPaymentStatus;
  providerTxnId?: string;
  providerRaw?: unknown;
  failureReason?: string;
  paidAt?: Date;
}): Promise<{ order: POrder; transaction: PTransaction }> {
  const { transactionId, status } = params;

  // Step 1 — atomic state guard + update. Only mutate when the row is
  // still in a non-terminal state we observed. Two concurrent callers
  // cannot both pass this check: the second one matches 0 rows.
  const terminalStatuses: PPaymentStatus[] = ['paid', 'failed', 'cancelled', 'refunded'];

  const result = await prisma.$transaction(async (tx) => {
    const guarded = await tx.transaction.updateMany({
      where: {
        id: transactionId,
        status: { notIn: terminalStatuses },
      },
      data: {
        status,
        providerTxnId: params.providerTxnId ?? undefined,
        providerRaw:
          params.providerRaw !== undefined ? params.providerRaw : undefined,
        failureReason: params.failureReason ?? undefined,
        paidAt: status === 'paid' ? (params.paidAt ?? new Date()) : undefined,
      },
    });

    const transaction = await tx.transaction.findUnique({ where: { id: transactionId } });
    if (!transaction) throw new Error('Transaction not found');

    if (guarded.count === 0) {
      const order = await tx.order.findUnique({ where: { id: transaction.orderId } });
      if (!order) throw new Error('Order not found');
      return { order, transaction };
    }

    const nextOrderStatus: POrderStatus | undefined =
      status === 'paid' ? 'confirmed' : undefined;
    const order = await tx.order.update({
      where: { id: transaction.orderId },
      data: {
        paymentStatus: status,
        ...(nextOrderStatus ? { status: nextOrderStatus } : {}),
      },
    });
    return { order, transaction };
  });
  const { order, transaction } = result;

  // Step 3 — refund side-effect: if the order was already delivered
  // and we are now refunding it, reverse every seller credit. Runs
  // OUTSIDE the interactive transaction on purpose — reverseSellersForOrder
  // owns its own $transaction per line, and is idempotent via
  // `refund:<orderItemId>` dedupeKeys.
  if (status === 'refunded' && order.status === 'delivered') {
    try {
      await reverseSellersForOrder(order.id);
    } catch (reverseErr) {
      // Never fail the payment update because of a wallet reversal
      // hiccup — log so ops can retry the reversal manually.
      logger.error(
        'payment.apply_result.reversal_failed',
        { transactionId, orderId: order.id },
        reverseErr,
      );
    }
  }

  return { order, transaction };
}
