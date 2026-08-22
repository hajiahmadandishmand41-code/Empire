/** Payment result lifecycle with inventory release on failed/cancelled payments. */
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
  const terminalStatuses: PPaymentStatus[] = ['paid', 'failed', 'cancelled', 'refunded'];

  const result = await prisma.$transaction(async (tx) => {
    const guarded = await tx.transaction.updateMany({
      where: { id: params.transactionId, status: { notIn: terminalStatuses } },
      data: {
        status: params.status,
        providerTxnId: params.providerTxnId ?? undefined,
        providerRaw: params.providerRaw !== undefined ? toPrismaJson(params.providerRaw) : undefined,
        failureReason: params.failureReason ?? undefined,
        paidAt: params.status === 'paid' ? (params.paidAt ?? new Date()) : undefined,
      },
    });

    const transaction = await tx.transaction.findUnique({ where: { id: params.transactionId } });
    if (!transaction) throw new Error('Transaction not found');

    if (guarded.count === 0) {
      const order = await tx.order.findUnique({ where: { id: transaction.orderId } });
      if (!order) throw new Error('Order not found');
      return { order, transaction };
    }

    if (params.status === 'failed' || params.status === 'cancelled') {
      const items = await tx.orderItem.findMany({
        where: { orderId: transaction.orderId },
        select: { productId: true, quantity: true },
      });
      for (const item of items) {
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

    const nextStatus: POrderStatus = params.status === 'paid'
      ? 'confirmed'
      : params.status === 'failed' || params.status === 'cancelled'
        ? 'cancelled'
        : undefined as never;

    const order = await tx.order.update({
      where: { id: transaction.orderId },
      data: {
        paymentStatus: params.status,
        ...(nextStatus ? { status: nextStatus } : {}),
      },
    });
    return { order, transaction };
  });

  if (params.status === 'refunded' && result.order.status === 'delivered') {
    try {
      await reverseSellersForOrder(result.order.id);
    } catch (reverseErr) {
      logger.error('payment.apply_result.reversal_failed', { transactionId: params.transactionId, orderId: result.order.id }, reverseErr);
    }
  }

  return result;
}
