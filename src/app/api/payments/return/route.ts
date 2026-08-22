/** GET /api/payments/return — authenticated browser return for ATOMA Pay. */
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
  if (!isDatabaseConfigured() || !txnId) return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}`, req.url));

  try {
    const txn = await prisma.transaction.findUnique({ where: { id: txnId } });
    if (!txn) return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}`, req.url));
    const order = await prisma.order.findUnique({ where: { id: txn.orderId }, select: { id: true, reference: true, userId: true } });
    if (!order) return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}`, req.url));

    const currentUser = await getCurrentUser();
    let authorized = false;
    if (order.userId) authorized = Boolean(currentUser && (currentUser.id === order.userId || currentUser.role === 'admin'));
    else if (currentUser) authorized = currentUser.role === 'admin';
    else authorized = verifyGuestReceiptToken(req.cookies.get(guestReceiptCookieName(order.id))?.value, order.id);
    if (!authorized) return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}`, req.url));

    // The browser's `cancelled=1` query is only a navigation hint, not proof of
    // payment cancellation. Always verify the provider before mutating payment
    // state; otherwise a late/forged browser return could cancel a paid charge.
    if (txn.status === 'pending' && txn.providerTxnId) {
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
        // Webhook remains authoritative when the provider cannot be verified.
      }
    }

    return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}/payment/${order.reference}`, req.url));
  } catch {
    return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}`, req.url));
  }
}
