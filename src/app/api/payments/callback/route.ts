/**
 * POST /api/payments/callback
 *
 * ATOMA Pay webhook. Signature is verified with HMAC-SHA256 against
 * the raw body. On success the linked order transitions to
 * paymentStatus=paid / status=confirmed. On failure it is marked
 * failed. This endpoint is idempotent.
 */
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { verifyAtomaPaySignature } from '@/lib/payments/atoma-pay';
import { applyPaymentResult } from '@/lib/payments/apply-result';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

const callbackSchema = z.object({
  event: z.string().optional(),
  reference: z.string().optional(), // our order reference
  payment_id: z.string().optional(),
  id: z.string().optional(),
  status: z.string(),
  amount: z.union([z.string(), z.number()]),
  currency: z.string().min(1).max(8),
  paid_at: z.string().optional(),
  failure_reason: z.string().optional(),
});

export async function OPTIONS() {
  return jsonPreflight();
}

export async function POST(req: NextRequest) {
  if (!isDatabaseConfigured()) {
    return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('x-atoma-signature');
  if (!verifyAtomaPaySignature(rawBody, signature)) {
    return jsonError('invalid_signature', 'Invalid webhook signature', { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return jsonError('invalid_json', 'Body is not valid JSON', { status: 400 });
  }
  const parsed = callbackSchema.safeParse(json);
  if (!parsed.success) {
    return jsonError('invalid_body', 'Invalid webhook payload', {
      status: 422,
      details: { issues: parsed.error.issues },
    });
  }
  const payload = parsed.data;
  const providerTxnId = payload.payment_id ?? payload.id ?? '';

  try {
    // Match by providerTxnId first, then by order reference (fallback).
    let txn = providerTxnId
      ? await prisma.transaction.findFirst({ where: { providerTxnId } })
      : null;

    if (!txn && payload.reference) {
      const order = await prisma.order.findUnique({
        where: { reference: payload.reference },
        include: {
          transactions: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      });
      txn = order?.transactions[0] ?? null;
    }

    if (!txn) {
      return jsonError('transaction_not_found', 'Unknown transaction', { status: 404 });
    }
    if (txn.method !== 'atoma_pay' || txn.provider !== 'atoma_pay') {
      return jsonError('provider_mismatch', 'Webhook provider does not match transaction', { status: 409 });
    }
    if (!providerTxnId || (txn.providerTxnId && txn.providerTxnId !== providerTxnId)) {
      return jsonError('provider_transaction_mismatch', 'Provider transaction does not match', { status: 409 });
    }

    {
      let callbackAmount: Prisma.Decimal;
      try {
        callbackAmount = new Prisma.Decimal(String(payload.amount));
      } catch {
        return jsonError('invalid_amount', 'Invalid payment amount', { status: 422 });
      }
      if (!callbackAmount.eq(txn.amount)) {
        return jsonError('amount_mismatch', 'Payment amount does not match the order', { status: 409 });
      }
    }
    if (payload.currency.toUpperCase() !== txn.currency.toUpperCase()) {
      return jsonError('currency_mismatch', 'Payment currency does not match the order', {
        status: 409,
      });
    }

    const normalized =
      payload.status === 'succeeded' || payload.status === 'paid'
        ? 'paid'
        : payload.status === 'failed'
          ? 'failed'
          : payload.status === 'cancelled' || payload.status === 'canceled'
            ? 'cancelled'
            : 'pending';

    // Idempotency: if already in the target terminal state, just ack.
    if (txn.status === normalized && normalized !== 'pending') {
      return jsonOk({ ok: true, idempotent: true, status: normalized });
    }

    await applyPaymentResult({
      transactionId: txn.id,
      status: normalized,
      providerTxnId: providerTxnId || txn.providerTxnId || undefined,
      providerRaw: payload,
      failureReason: payload.failure_reason,
      paidAt: payload.paid_at ? new Date(payload.paid_at) : undefined,
    });

    return jsonOk({ ok: true, status: normalized });
  } catch (err) {
    console.error('[api/payments/callback]', err);
    return jsonError('callback_failed', 'Failed to process callback', { status: 500 });
  }
}
