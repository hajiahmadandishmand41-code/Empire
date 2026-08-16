/**
 * POST /api/payments/initiate
 *
 * Body: { orderReference: string }
 */
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';
import { createAtomaPaySession } from '@/lib/payments/atoma-pay';
import { logger } from '@/lib/logger';
import { getCurrentUser } from '@/lib/auth/current-user';
import { toPrismaJson } from '@/lib/prisma-json';
import { GUEST_RECEIPT_COOKIE, verifyGuestReceiptToken } from '@/lib/auth/guest-receipt';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({ orderReference: z.string().trim().min(4).max(64) });

function baseUrl(req: NextRequest): string {
  return process.env.ATOMA_PAY_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
}

export async function OPTIONS() { return jsonPreflight(); }

export async function POST(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'payments:initiate'), { limit: 30, windowMs: 60_000 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  let raw: unknown;
  try { raw = await req.json(); }
  catch { return jsonError('invalid_json', 'Request body is not valid JSON', { status: 400 }); }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return jsonError('invalid_body', 'Invalid payload', { status: 422, details: { issues: parsed.error.issues } });

  try {
    const order = await prisma.order.findUnique({ where: { reference: parsed.data.orderReference }, include: { address: true } });
    if (!order) return jsonError('order_not_found', 'Order not found', { status: 404 });

    const currentUser = await getCurrentUser();
    if (order.userId) {
      if (!currentUser || (currentUser.id !== order.userId && currentUser.role !== 'admin')) {
        return jsonError('forbidden', 'Not allowed to pay for this order', { status: 403 });
      }
    } else if (currentUser) {
      if (currentUser.role !== 'admin') return jsonError('forbidden', 'Not allowed to pay for this order', { status: 403 });
    } else {
      const guestToken = req.cookies.get(GUEST_RECEIPT_COOKIE)?.value;
      if (!verifyGuestReceiptToken(guestToken, order.id)) {
        return jsonError('forbidden', 'A valid guest order receipt is required', { status: 403 });
      }
    }

    if (order.paymentStatus === 'paid') return jsonError('already_paid', 'Order is already paid', { status: 409 });
    if (order.status === 'cancelled') return jsonError('order_cancelled', 'Cancelled orders cannot be paid', { status: 409 });

    let txn = await prisma.transaction.findFirst({
      where: { orderId: order.id, status: 'pending', method: order.paymentMethod },
      orderBy: { createdAt: 'desc' },
    });

    if (!txn) {
      try {
        txn = await prisma.transaction.create({
          data: {
            orderId: order.id,
            reference: `TXN-${order.reference}-${Date.now().toString(36).toUpperCase()}-${cryptoRandomSuffix()}`,
            provider: order.paymentMethod,
            method: order.paymentMethod,
            status: 'pending',
            amount: order.total,
            currency: order.currency,
          },
        });
      } catch (err) {
        // The schema has a unique (orderId, method, status) constraint. If two
        // browser requests race, one wins creation and the loser must reuse it.
        if (isPrismaUniqueViolation(err)) {
          txn = await prisma.transaction.findFirst({
            where: { orderId: order.id, status: 'pending', method: order.paymentMethod },
            orderBy: { createdAt: 'desc' },
          });
        }
        if (!txn) throw err;
      }
    }

    if (order.paymentMethod === 'cod') {
      return jsonOk({ transactionId: txn.id, reference: txn.reference, method: 'cod', status: 'pending', message: 'Order will be paid in cash on delivery.' });
    }

    if (order.paymentMethod === 'atoma_pay') {
      const b = baseUrl(req);
      const session = await createAtomaPaySession({
        orderReference: order.reference,
        amount: order.total,
        currency: order.currency,
        description: `Empire Shop order ${order.reference}`,
        customer: { fullName: order.address.fullName, phone: order.address.phone },
        returnUrl: `${b}/api/payments/return?txn=${encodeURIComponent(txn.id)}`,
        cancelUrl: `${b}/api/payments/return?txn=${encodeURIComponent(txn.id)}&cancelled=1`,
        webhookUrl: `${b}/api/payments/callback`,
      });

      await prisma.transaction.update({
        where: { id: txn.id },
        data: { providerTxnId: session.providerTxnId, providerRaw: toPrismaJson(session.raw) },
      });

      return jsonOk({ transactionId: txn.id, reference: txn.reference, method: 'atoma_pay', status: 'pending', redirectUrl: session.redirectUrl, mock: session.mock });
    }

    return jsonOk({ transactionId: txn.id, reference: txn.reference, method: order.paymentMethod, status: 'pending', message: 'Awaiting manual confirmation.' });
  } catch (err) {
    logger.error('payments.initiate_failed', {}, err);
    return jsonError('payment_init_failed', 'Failed to initiate payment', { status: 500 });
  }
}

function cryptoRandomSuffix(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

function isPrismaUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002';
}
