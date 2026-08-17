/**
 * ATOMA Pay adapter.
 *
 * The provider's concrete API paths and credentials are configuration-driven.
 * No mock payment flow exists: when the provider is not configured, payment
 * initiation/verification fails explicitly instead of returning a fake success.
 *
 * Environment variables:
 *   ATOMA_PAY_BASE_URL              - official ATOMA API base URL
 *   ATOMA_PAY_CREATE_PATH           - payment creation path
 *   ATOMA_PAY_STATUS_PATH           - payment status path template
 *   ATOMA_PAY_MERCHANT_ID           - merchant identifier
 *   ATOMA_PAY_API_KEY               - server-side secret
 *   ATOMA_PAY_WEBHOOK_SECRET        - HMAC secret for callback verification
 *   ATOMA_PAY_PUBLIC_BASE_URL       - public return/cancel URL base
 */
import crypto from 'node:crypto';
import { Prisma } from '@prisma/client';

export interface AtomaPaySessionInput {
  orderReference: string;
  amount: Prisma.Decimal | string;
  currency: string;
  description: string;
  customer: {
    fullName: string;
    phone: string;
    email?: string;
  };
  returnUrl: string;
  cancelUrl: string;
  webhookUrl: string;
}

export interface AtomaPaySession {
  providerTxnId: string;
  redirectUrl: string;
  status: 'pending' | 'paid' | 'failed';
  raw: unknown;
  mock: false;
}

export interface AtomaPayStatus {
  providerTxnId: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  amount?: Prisma.Decimal | string;
  currency?: string;
  paidAt?: string;
  failureReason?: string;
  raw: unknown;
  mock: false;
}

function config() {
  return {
    baseUrl: process.env.ATOMA_PAY_BASE_URL || '',
    createPath: process.env.ATOMA_PAY_CREATE_PATH || '/v1/payments',
    statusPath: process.env.ATOMA_PAY_STATUS_PATH || '/v1/payments/:id',
    merchantId: process.env.ATOMA_PAY_MERCHANT_ID || '',
    apiKey: process.env.ATOMA_PAY_API_KEY || '',
    webhookSecret: process.env.ATOMA_PAY_WEBHOOK_SECRET || '',
  };
}

export function isAtomaPayConfigured(): boolean {
  const c = config();
  return Boolean(c.baseUrl && c.merchantId && c.apiKey && c.webhookSecret);
}

function requireConfigured(): ReturnType<typeof config> {
  const c = config();
  if (!c.baseUrl || !c.merchantId || !c.apiKey || !c.webhookSecret) {
    throw new Error('ATOMA Pay is not fully configured. Required provider credentials and webhook secret are missing.');
  }
  return c;
}

/** Create a hosted payment session against the real provider. */
export async function createAtomaPaySession(
  input: AtomaPaySessionInput,
): Promise<AtomaPaySession> {
  const c = requireConfigured();
  const base = c.baseUrl.replace(/\/$/, '');
  const path = c.createPath.startsWith('/') ? c.createPath : `/${c.createPath}`;

  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${c.apiKey}`,
      'X-Merchant-Id': c.merchantId,
    },
    body: JSON.stringify({
      reference: input.orderReference,
      amount: new Prisma.Decimal(input.amount).toFixed(2),
      currency: input.currency,
      description: input.description,
      customer: input.customer,
      return_url: input.returnUrl,
      cancel_url: input.cancelUrl,
      webhook_url: input.webhookUrl,
    }),
    cache: 'no-store',
  });

  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      raw && typeof raw === 'object' && 'message' in raw
        ? String((raw as { message: unknown }).message)
        : `ATOMA Pay returned HTTP ${res.status}`;
    throw new Error(msg);
  }

  const data = raw as {
    id?: string;
    payment_id?: string;
    redirect_url?: string;
    checkout_url?: string;
    status?: string;
  };
  const providerTxnId = data.id ?? data.payment_id ?? '';
  const redirectUrl = data.redirect_url ?? data.checkout_url ?? '';
  if (!providerTxnId || !redirectUrl) {
    throw new Error('ATOMA Pay response is missing payment id or checkout URL.');
  }

  return {
    providerTxnId,
    redirectUrl,
    status: data.status === 'paid' ? 'paid' : data.status === 'failed' ? 'failed' : 'pending',
    raw,
    mock: false,
  };
}

/** Verify payment status against the real provider. */
export async function verifyAtomaPayStatus(providerTxnId: string): Promise<AtomaPayStatus> {
  const c = requireConfigured();
  const statusPath = c.statusPath.replace(':id', encodeURIComponent(providerTxnId));
  const base = c.baseUrl.replace(/\/$/, '');
  const path = statusPath.startsWith('/') ? statusPath : `/${statusPath}`;

  const res = await fetch(`${base}${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${c.apiKey}`,
      'X-Merchant-Id': c.merchantId,
    },
    cache: 'no-store',
  });
  const raw = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`ATOMA Pay verify returned HTTP ${res.status}`);

  const data = raw as {
    id?: string;
    status?: string;
    amount?: string | number;
    currency?: string;
    paid_at?: string;
    failure_reason?: string;
  };
  const normalized: AtomaPayStatus['status'] =
    data.status === 'succeeded' || data.status === 'paid'
      ? 'paid'
      : data.status === 'failed'
        ? 'failed'
        : data.status === 'cancelled' || data.status === 'canceled'
          ? 'cancelled'
          : 'pending';

  return {
    providerTxnId: data.id ?? providerTxnId,
    status: normalized,
    amount: data.amount == null ? undefined : new Prisma.Decimal(String(data.amount)),
    currency: data.currency,
    paidAt: data.paid_at,
    failureReason: data.failure_reason,
    raw,
    mock: false,
  };
}

/** Verify the HMAC-SHA256 signature ATOMA Pay attaches to webhooks. */
export function verifyAtomaPaySignature(rawBody: string, signature: string | null): boolean {
  const c = config();
  if (!c.webhookSecret || !signature) return false;
  const expected = crypto.createHmac('sha256', c.webhookSecret).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
