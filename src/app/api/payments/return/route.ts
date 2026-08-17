/**
 * GET /api/payments/return
 *
 * Browser return endpoint for ATOMA Pay. Transaction IDs are identifiers, not
 * credentials, so order ownership/guest receipt authorization is required
 * before any local payment-state mutation.
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { verifyAtomaPayStatus } from '@/lib/payments/atoma-pay';
import { applyPaymentResult } from '@/lib/payments/apply-result';
import { getCurrentUser } from '@/lib/auth/current-user';
import { guestReceiptCookieName, verifyGuestReceiptToken } from '@/lib/auth/guest-receipt';

export const dynamic = 'force-dynamic';
const DEFAULT_LOCALE = 'fa';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const txnId = url.searchParams.get('txn');
  const cancelled = url.searchParams.get('cancelled') === '1';

  if (!isDatabaseConfigured() || !txnId) {
    return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}`, req.url));
  }

  try {
    const txn = await prisma.transaction.findUnique({ where: { id: txnId } });
    if (!txn) return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}`, req.url));

    const order = await prisma.order.findUnique({ where: { id: txn.orderId }, select: { id: true, reference: true, userId: true } });
    if (!order) return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}`, req.url));

    const currentUser = await getCurrentUser();
    let authorized = false;

    if (order.userId) {
      authorized = Boolean(currentUser && (currentUser.id === order.userId || currentUser.role === 'admin'));
    } else if (currentUser) {
      authorized = currentUser.role === 'admin';
    } else {
      const guestToken = req.cookies.get(guestReceiptCookieName(order.id))?.value;
      authorized = verifyGuestReceiptToken(guestToken, order.id);
    }

    if (!authorized) {
      return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}`, req.url));
    }

    if (cancelled) {
      await applyPaymentResult({
        transactionId: txn.id,
        status: 'cancelled',
        failureReason: 'user_cancelled',
      });
    } else if (txn.status === 'pending' && txn.providerTxnId) {
      try {
        const remote = await verifyAtomaPayStatus(txn.providerTxnId);
        if (remote.status !== 'pending') {
          await applyPaymentResult({
            transactionId: txn.id,
            status: remote.status,
            providerTxnId: remote.providerTxnId,
            providerRaw: remote.raw,
            paidAt: remote.paidAt ? new Date(remote.paidAt) : undefined,
            failureReason: remote.failureReason,
          });
        }
      } catch {
        // The provider callback remains the authoritative asynchronous source
        // of payment status. A temporary verify failure must not fabricate a
        // local payment result.
      }
    }

    return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}/payment/${order.reference}`, req.url));
  } catch {
    return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}`, req.url));
  }
}
