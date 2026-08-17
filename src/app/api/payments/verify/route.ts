/** Protected payment verification API with secure guest receipt support. */
import type { NextRequest } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { verifyAtomaPayStatus } from '@/lib/payments/atoma-pay';
import { applyPaymentResult } from '@/lib/payments/apply-result';
import { getCurrentUser } from '@/lib/auth/current-user';
import { clientKey, rateLimitAsync, RATE_PRESETS } from '@/lib/api/rate-limit';
import { guestReceiptCookieName, verifyGuestReceiptToken } from '@/lib/auth/guest-receipt';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export async function OPTIONS() { return jsonPreflight(); }

export async function GET(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'payments:verify'), RATE_PRESETS.payments);
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });
  const currentUser = await getCurrentUser();
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  const url = new URL(req.url);
  const transactionId = url.searchParams.get('transactionId');
  const reference = url.searchParams.get('reference');
  if (!transactionId && !reference) return jsonError('missing_query', 'Provide transactionId or reference', { status: 400 });

  try {
    let txn = transactionId ? await prisma.transaction.findUnique({ where: { id: transactionId } }) : null;
    let order = txn ? await prisma.order.findUnique({ where: { id: txn.orderId } }) : null;

    if (!txn && reference) {
      const orderByRef = await prisma.order.findUnique({ where: { reference }, include: { transactions: { orderBy: { createdAt: 'desc' }, take: 1 } } });
      txn = orderByRef?.transactions[0] ?? null;
      order = orderByRef ?? null;
    }

    if (!txn || !order) return jsonError('transaction_not_found', 'Transaction not found', { status: 404 });

    const isAdmin = currentUser?.role === 'admin';
    const isOwner = Boolean(currentUser && order.userId && order.userId === currentUser.id);
    const isGuest = Boolean(!currentUser && !order.userId && verifyGuestReceiptToken(req.cookies.get(guestReceiptCookieName(order.id))?.value, order.id));
    if (!isAdmin && !isOwner && !isGuest) return jsonError('transaction_not_found', 'Transaction not found', { status: 404 });

    if (txn.status === 'pending' && txn.method === 'atoma_pay' && txn.providerTxnId) {
      try {
        const remote = await verifyAtomaPayStatus(txn.providerTxnId);
        if (remote.status !== 'pending') {
          const applied = await applyPaymentResult({
            transactionId: txn.id,
            status: remote.status,
            providerTxnId: remote.providerTxnId,
            providerRaw: remote.raw,
            failureReason: remote.failureReason,
            paidAt: remote.paidAt ? new Date(remote.paidAt) : undefined,
          });
          txn = applied.transaction;
          order = await prisma.order.findUnique({ where: { id: txn.orderId } });
        }
      } catch (err) {
        logger.warn('payments.verify_live_check_failed', {}, err);
      }
    }

    return jsonOk({
      transactionId: txn.id,
      reference: txn.reference,
      method: txn.method,
      status: txn.status,
      amount: txn.amount.toNumber(),
      currency: txn.currency,
      paidAt: txn.paidAt?.toISOString() ?? null,
      order: order ? { reference: order.reference, status: order.status, paymentStatus: order.paymentStatus } : null,
    });
  } catch (err) {
    logger.error('payments.verify_failed', {}, err);
    return jsonError('verify_failed', 'Failed to verify payment', { status: 500 });
  }
}
