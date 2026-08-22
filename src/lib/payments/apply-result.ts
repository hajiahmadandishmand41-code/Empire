/** Payment domain helpers. */
import { prisma } from '@/lib/db';
import type { Order as POrder, Transaction as PTransaction, PaymentStatus as PPaymentStatus, OrderStatus as POrderStatus } from '@prisma/client';
import { reverseSellersForOrder } from '@/lib/finance/wallet';
import { logger } from '@/lib/logger';
import { toPrismaJson } from '@/lib/prisma-json';

export async function applyPaymentResult(params: {
  transactionId: string;
  status: PPaymentStatus;
  providerTxnId?: string;
  providerRaw?: unknown;
  failureReason?: string;
  paidAt?: Date;
}): Promise<{ order: POrder; transaction: PTransaction }> {
  const { transactionId, status } = params;
  const terminalStatuses: PPaymentStatus[] = ['paid', 'failed', 'cancelled', 'refunded'];

  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.transaction.findUnique({
      where: { id: transactionId },
      include: { order: { include: { items: { select: { productId: true, quantity: true } } } } },
    });
    if (!current) throw new Error('Transaction not found');

    // Payment states are monotonic: a late browser return or webhook must not
    // downgrade a paid transaction or resurrect a cancelled order.
    if (terminalStatuses.includes(current.status)) {
      const order = await tx.order.findUnique({ where: { id: current.orderId } });
      if (!order) throw new Error('Order not found');
      return { order, transaction: current };
    }
    if (status === 'paid' && current.order.status === 'cancelled') {
      return { order: current.order, transaction: current };
    }

    const guarded = await tx.transaction.updateMany({
      where: { id: transactionId, status: { notIn: terminalStatuses } },
      data: {
        status,
        providerTxnId: params.providerTxnId ?? undefined,
        providerRaw: params.providerRaw !== undefined ? toPrismaJson(params.providerRaw) : undefined,
        failureReason: params.failureReason ?? undefined,
        paidAt: status === 'paid' ? (params.paidAt ?? new Date()) : undefined,
      },
    });
    if (guarded.count === 0) {
      const order = await tx.order.findUniqueOrThrow({ where: { id: current.orderId } });
      const transaction = await tx.transaction.findUniqueOrThrow({ where: { id: transactionId } });
      return { order, transaction };
    }

    const order = await tx.order.findUniqueOrThrow({ where: { id: current.orderId } });

    if (status === 'failed' || status === 'cancelled') {
      // Only an order still waiting for payment may release its reservation.
      // A stale failure must never move an already-confirmed order backwards.
      if (order.status === 'pending') {
        for (const item of current.order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: { increment: item.quantity },
              salesCount: { decrement: item.quantity },
              inStock: true,
            },
          });
        }
        await tx.order.update({ where: { id: order.id }, data: { paymentStatus: status, status: 'cancelled' } });
      } else {
        await tx.order.update({ where: { id: order.id }, data: { paymentStatus: status } });
      }
    } else {
      const nextOrderStatus: POrderStatus | undefined = status === 'paid' ? 'confirmed' : undefined;
      await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: status, ...(nextOrderStatus ? { status: nextOrderStatus } : {}) },
      });
    }

    const updatedOrder = await tx.order.findUniqueOrThrow({ where: { id: order.id } });
    const updatedTransaction = await tx.transaction.findUniqueOrThrow({ where: { id: transactionId } });
    return { order: updatedOrder, transaction: updatedTransaction };
  });

  const { order, transaction } = result;
  if (status === 'refunded' && order.status === 'delivered') {
    try {
      await reverseSellersForOrder(order.id);
    } catch (reverseErr) {
      logger.error('payment.apply_result.reversal_failed', { transactionId, orderId: order.id }, reverseErr);
    }
  }
  return { order, transaction };
}
