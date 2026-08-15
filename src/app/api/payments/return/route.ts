/**
 * GET /api/payments/return
 *
 * ATOMA Pay redirects the user back here (returnUrl / cancelUrl).
 * We verify status once, then bounce the browser to the localized
 * order-success or payment page.
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { verifyAtomaPayStatus } from '@/lib/payments/atoma-pay';
import { applyPaymentResult } from '@/lib/payments/apply-result';

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
      } catch (err) {
        console.warn('[api/payments/return] verify failed:', err);
      }
    }

    const order = await prisma.order.findUnique({ where: { id: txn.orderId } });
    const ref = order?.reference ?? '';
    const target = new URL(`/${DEFAULT_LOCALE}/payment/${ref}`, req.url);
    return NextResponse.redirect(target);
  } catch (err) {
    console.error('[api/payments/return]', err);
    return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}`, req.url));
  }
}
