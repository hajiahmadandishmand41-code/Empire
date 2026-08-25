/** Payment domain helpers. */
import { prisma } from '@/lib/db';
import type { Order as POrder, Transaction as PTransaction, PaymentStatus as PPaymentStatus, OrderStatus as POrderStatus } from '@prisma/client';
import { reverseSellersForOrder } from '@/lib/finance/wallet';
import { logger } from '@/lib/logger';
import { toPrismaJson } from '@/lib/prisma-json';
import { consumeOrderStockReservations, releaseOrderStockReservations, setSellerOrdersStatus, syncParentOrderStatus } from '@/lib/orders/order-engine';

export async function applyPaymentResult(params: {
  transactionId: string;
  status: PPaymentStatus;
  providerTxnId?: string;
  providerRaw?: unknown;
  failureReason?: string;
  paidAt?: Date;
}): Promise<{ order: POrder; transaction: PTransaction }> {
  const { transactionId, status } = params;
  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.transaction.findUnique({
      where: { id: transactionId },
      include: { order: { include: { items: { select: { productId: true, quantity: true } } } } },
    });
    if (!current) throw new Error('Transaction not found');

    if (current.status === 'refunded' || current.status === 'failed' || current.status === 'cancelled') {
      const order = await tx.order.findUniqueOrThrow({ where: { id: current.orderId } });
      return { order, transaction: current };
    }
    if (current.status === 'paid' && status !== 'refunded') {
      const order = await tx.order.findUniqueOrThrow({ where: { id: current.orderId } });
      return { order, transaction: current };
    }
    if (status === 'refunded' && current.status !== 'paid' && current.status !== 'refunded') {
      const order = await tx.order.findUniqueOrThrow({ where: { id: current.orderId } });
      return { order, transaction: current };
    }
    if (status === 'paid' && current.order.status === 'cancelled') return { order: current.order, transaction: current };

    if (current.status === 'refunded') return { order: current.order, transaction: current };

    const guarded = await tx.transaction.updateMany({
      where: { id: transactionId, ...(current.status === 'paid' ? { status: 'paid' } : { status: 'pending' }) },
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
    if (status === 'paid') {
      for (const item of current.order.items) await tx.product.update({ where: { id: item.productId }, data: { salesCount: { increment: item.quantity } } });
      await consumeOrderStockReservations(tx, order.id);
      await setSellerOrdersStatus(tx, order.id, 'confirmed');
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: 'paid', status: 'confirmed' as POrderStatus } });
    } else if (status === 'failed' || status === 'cancelled') {
      const released = await releaseOrderStockReservations(tx, order.id);
      if (!released.hadReservations) {
        for (const item of current.order.items) {
          await tx.product.update({ where: { id: item.productId }, data: { stockQuantity: { increment: item.quantity }, salesCount: { decrement: item.quantity }, inStock: true } });
        }
      }
      await setSellerOrdersStatus(tx, order.id, 'cancelled');
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: status, status: 'cancelled' } });
    } else if (status === 'refunded') {
      for (const item of current.order.items) {
        await tx.$executeRaw`
          UPDATE "Product" SET "salesCount" = GREATEST(0, "salesCount" - ${item.quantity}) WHERE "id" = ${item.productId}
        `;
      }
      await setSellerOrdersStatus(tx, order.id, 'refunded');
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: 'refunded' } });
    }

    await syncParentOrderStatus(tx, order.id);
    const updatedOrder = await tx.order.findUniqueOrThrow({ where: { id: order.id } });
    const updatedTransaction = await tx.transaction.findUniqueOrThrow({ where: { id: transactionId } });
    return { order: updatedOrder, transaction: updatedTransaction };
  });

  const { order, transaction } = result;
  if (status === 'refunded') {
    try {
      await reverseSellersForOrder(order.id);
    } catch (reverseErr) {
      logger.error('payment.apply_result.reversal_failed', { transactionId, orderId: order.id }, reverseErr);
      throw reverseErr;
    }
  }
  return { order, transaction };
}
