/** Payment domain helpers. */
import { prisma } from '@/lib/db';
import type {
  Order as POrder,
  Transaction as PTransaction,
  PaymentStatus as PPaymentStatus,
  OrderStatus as POrderStatus,
} from '@prisma/client';
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

    const transaction = await tx.transaction.findUnique({ where: { id: transactionId } });
    if (!transaction) throw new Error('Transaction not found');

    if (guarded.count === 0) {
      const order = await tx.order.findUnique({ where: { id: transaction.orderId } });
      if (!order) throw new Error('Order not found');
      return { order, transaction };
    }

    if (status === 'failed' || status === 'cancelled') {
      const orderItems = await tx.orderItem.findMany({
        where: { orderId: transaction.orderId },
        select: { productId: true, quantity: true },
      });

      for (const item of orderItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stockQuantity: true, salesCount: true },
        });
        if (!product) continue;

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { increment: item.quantity },
            inStock: true,
            salesCount: Math.max(0, product.salesCount - item.quantity),
          },
        });
      }
    }

    const nextOrderStatus: POrderStatus | undefined =
      status === 'paid' ? 'confirmed' :
      status === 'failed' || status === 'cancelled' ? 'cancelled' :
      undefined;

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
  if (status === 'refunded' && order.status === 'delivered') {
    try {
      await reverseSellersForOrder(order.id);
    } catch (reverseErr) {
      logger.error('payment.apply_result.reversal_failed', { transactionId, orderId: order.id }, reverseErr);
    }
  }

  return { order, transaction };
}
