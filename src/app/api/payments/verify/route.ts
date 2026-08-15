/**
 * GET /api/payments/verify?transactionId=... | ?reference=...
 *
 * Client-side polling endpoint. Also actively re-checks ATOMA Pay
 * if the transaction is still pending (defence against a missed
 * webhook). Never mutates on a `pending` provider response.
 *
 * Security (Stage 5):
 * - Requires a valid session (401 if unauthenticated).
 * - Ownership check: the order must belong to the requesting user.
 *   Both "not found" and "not yours" return 404 to prevent enumeration.
 * - Rate-limited (payments preset: 20 req/min per IP).
 * - Response never exposes internal IDs or raw provider data.
 */
import type { NextRequest } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { verifyAtomaPayStatus } from '@/lib/payments/atoma-pay';
import { applyPaymentResult } from '@/lib/payments/apply-result';
import { getCurrentUser } from '@/lib/auth/current-user';
import { clientKey, rateLimitAsync, RATE_PRESETS } from '@/lib/api/rate-limit';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return jsonPreflight();
}

export async function GET(req: NextRequest) {
  // ── Rate limit ──────────────────────────────────────────────────────────
  const rl = await rateLimitAsync(clientKey(req, 'payments:verify'), RATE_PRESETS.payments);
  if (!rl.ok) {
    return jsonError('rate_limited', 'Too many requests', { status: 429 });
  }

  // ── Authentication ──────────────────────────────────────────────────────
  // Unauthenticated callers must not be able to probe transaction records.
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return jsonError('unauthorized', 'Authentication required', { status: 401 });
  }

  // ── Database availability ───────────────────────────────────────────────
  if (!isDatabaseConfigured()) {
    return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  }

  const url = new URL(req.url);
  const transactionId = url.searchParams.get('transactionId');
  const reference = url.searchParams.get('reference');
  if (!transactionId && !reference) {
    return jsonError('missing_query', 'Provide transactionId or reference', { status: 400 });
  }

  try {
    // ── Resolve transaction ───────────────────────────────────────────────
    let txn = transactionId
      ? await prisma.transaction.findUnique({ where: { id: transactionId } })
      : null;

    let order = txn
      ? await prisma.order.findUnique({ where: { id: txn.orderId } })
      : null;

    if (!txn && reference) {
      const orderByRef = await prisma.order.findUnique({
        where: { reference },
        include: { transactions: { orderBy: { createdAt: 'desc' }, take: 1 } },
      });
      txn = orderByRef?.transactions[0] ?? null;
      order = orderByRef ?? null;
    }

    // ── Not found → 404 (same code for "not found" and "not yours" to
    //    prevent enumeration / transaction-ID probing) ─────────────────────
    if (!txn || !order) {
      return jsonError('transaction_not_found', 'Transaction not found', { status: 404 });
    }

    // ── Ownership check ───────────────────────────────────────────────────
    // Admin users can verify any transaction; customers and sellers can only
    // verify their own orders.
    const isAdmin = currentUser.role === 'admin';
    const orderUserId = (order as unknown as { userId?: string | null }).userId;

    if (!isAdmin && orderUserId !== currentUser.id) {
      // Return the same 404 as above — do not reveal that the record exists.
      return jsonError('transaction_not_found', 'Transaction not found', { status: 404 });
    }

    // ── Live status refresh (still pending) ───────────────────────────────
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
          // Reload order to reflect updated paymentStatus
          order = await prisma.order.findUnique({ where: { id: txn.orderId } });
        }
      } catch (err) {
        // Non-fatal: log the failure but continue with cached status.
        console.warn('[api/payments/verify] live verify failed:', err);
      }
    }

    // ── Response — no raw provider data, no internal IDs ─────────────────
    return jsonOk({
      transactionId: txn.id,
      reference: txn.reference,
      method: txn.method,
      status: txn.status,
      amount: txn.amount.toFixed(2),
      currency: txn.currency,
      paidAt: txn.paidAt?.toISOString() ?? null,
      order: order
        ? {
            reference: order.reference,
            status: order.status,
            paymentStatus: order.paymentStatus,
          }
        : null,
    });
  } catch (err) {
    console.error('[api/payments/verify]', err);
    return jsonError('verify_failed', 'Failed to verify payment', { status: 500 });
  }
}
