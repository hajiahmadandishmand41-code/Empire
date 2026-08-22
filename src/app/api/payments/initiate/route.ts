import { randomBytes } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';
import { createAtomaPaySession, verifyAtomaPayStatus } from '@/lib/payments/atoma-pay';
import { applyPaymentResult } from '@/lib/payments/apply-result';
import { logger } from '@/lib/logger';
import { getCurrentUser } from '@/lib/auth/current-user';
import { toPrismaJson } from '@/lib/prisma-json';
import { guestReceiptCookieName, verifyGuestReceiptToken } from '@/lib/auth/guest-receipt';

export const dynamic = 'force-dynamic';
const bodySchema = z.object({ orderReference: z.string().trim().min(4).max(64) });
function baseUrl(req: NextRequest): string { return process.env.ATOMA_PAY_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin; }
export async function OPTIONS() { return jsonPreflight(); }

export async function POST(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'payments:initiate'), { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  let raw: unknown;
  try { raw = await req.json(); } catch { return jsonError('invalid_json', 'Request body is not valid JSON', { status: 400 }); }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return jsonError('invalid_body', 'Invalid payload', { status: 422, details: { issues: parsed.error.issues } });

  try {
    const order = await prisma.order.findUnique({ where: { reference: parsed.data.orderReference }, include: { address: true } });
    if (!order) return jsonError('order_not_found', 'Order not found', { status: 404 });
    const currentUser = await getCurrentUser();
    if (order.userId) {
      if (!currentUser || (currentUser.id !== order.userId && currentUser.role !== 'admin')) return jsonError('forbidden', 'Not allowed to pay for this order', { status: 403 });
    } else if (currentUser) {
      if (currentUser.role !== 'admin') return jsonError('forbidden', 'Not allowed to pay for this order', { status: 403 });
    } else {
      if (!verifyGuestReceiptToken(req.cookies.get(guestReceiptCookieName(order.id))?.value, order.id)) return jsonError('forbidden', 'A valid guest order receipt is required', { status: 403 });
    }
    if (order.paymentStatus === 'paid') return jsonError('already_paid', 'Order is already paid', { status: 409 });
    if (order.status === 'cancelled') return jsonError('order_cancelled', 'Cancelled orders cannot be paid', { status: 409 });

    let txn = await prisma.transaction.findFirst({ where: { orderId: order.id, status: 'pending', method: order.paymentMethod }, orderBy: { createdAt: 'desc' } });
    if (!txn) {
      const previous = await prisma.transaction.findFirst({ where: { orderId: order.id, method: order.paymentMethod }, orderBy: { createdAt: 'desc' } });
      if (previous && (previous.status === 'failed' || previous.status === 'cancelled')) {
        txn = await prisma.transaction.update({ where: { id: previous.id }, data: { status: 'pending', providerTxnId: null, providerRaw: undefined, failureReason: null, paidAt: null } });
      }
    }
    if (!txn) {
      try {
        txn = await prisma.transaction.create({ data: { orderId: order.id, reference: `TXN-${order.reference}-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString('hex').toUpperCase()}`, provider: order.paymentMethod, method: order.paymentMethod, status: 'pending', amount: order.total, currency: order.currency } });
      } catch (err) {
        if (typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === 'P2002') txn = await prisma.transaction.findFirst({ where: { orderId: order.id, status: 'pending', method: order.paymentMethod }, orderBy: { createdAt: 'desc' } });
        if (!txn) throw err;
      }
    }

    if (order.paymentMethod === 'cod') return jsonOk({ transactionId: txn.id, reference: txn.reference, method: 'cod', status: 'pending', message: 'Order will be paid in cash on delivery.' });

    if (order.paymentMethod === 'atoma_pay') {
      // Reuse an existing provider session whenever possible. Creating a second
      // hosted session for the same transaction can charge the customer twice
      // and overwrites the callback's provider transaction id.
      if (txn.providerTxnId) {
        try {
          const remote = await verifyAtomaPayStatus(txn.providerTxnId);
          if (remote.status === 'paid') {
            await applyPaymentResult({ transactionId: txn.id, status: 'paid', providerTxnId: remote.providerTxnId, providerRaw: remote.raw, paidAt: remote.paidAt ? new Date(remote.paidAt) : undefined });
            return jsonError('already_paid', 'Payment has already been confirmed', { status: 409 });
          }
          if (remote.status === 'pending') {
            const stored = txn.providerRaw as { redirect_url?: unknown; checkout_url?: unknown } | null;
            const redirectUrl = typeof stored?.redirect_url === 'string' ? stored.redirect_url : typeof stored?.checkout_url === 'string' ? stored.checkout_url : null;
            if (redirectUrl) return jsonOk({ transactionId: txn.id, reference: txn.reference, method: 'atoma_pay', status: 'pending', redirectUrl, mock: false });
            return jsonError('payment_session_exists', 'An existing payment session is still pending. Please use the provider payment session or wait for its callback.', { status: 409 });
          }
          // Failed/cancelled provider sessions can be replaced safely after the
          // existing transaction is reset below.
          txn = await prisma.transaction.update({ where: { id: txn.id }, data: { status: 'pending', providerTxnId: null, providerRaw: undefined, failureReason: null, paidAt: null } });
        } catch (err) {
          logger.error('payments.initiate.verify_existing_failed', { transactionId: txn.id }, err);
          return jsonError('payment_session_check_failed', 'Could not verify the existing payment session. Please try again.', { status: 503 });
        }
      }

      const b = baseUrl(req);
      const session = await createAtomaPaySession({ orderReference: order.reference, amount: order.total, currency: order.currency, description: `Empire Shop order ${order.reference}`, customer: { fullName: order.address.fullName, phone: order.address.phone }, returnUrl: `${b}/api/payments/return?txn=${encodeURIComponent(txn.id)}`, cancelUrl: `${b}/api/payments/return?txn=${encodeURIComponent(txn.id)}&cancelled=1`, webhookUrl: `${b}/api/payments/callback` });
      await prisma.transaction.update({ where: { id: txn.id }, data: { providerTxnId: session.providerTxnId, providerRaw: toPrismaJson(session.raw), failureReason: null } });
      return jsonOk({ transactionId: txn.id, reference: txn.reference, method: 'atoma_pay', status: 'pending', redirectUrl: session.redirectUrl, mock: session.mock });
    }

    return jsonOk({ transactionId: txn.id, reference: txn.reference, method: order.paymentMethod, status: 'pending', message: 'Awaiting manual confirmation.' });
  } catch (err) {
    logger.error('payments.initiate_failed', {}, err);
    return jsonError('payment_init_failed', 'Failed to initiate payment', { status: 500 });
  }
}
