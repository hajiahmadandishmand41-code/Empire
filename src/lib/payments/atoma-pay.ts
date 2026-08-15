/**
 * ATOMA Pay client.
 *
 * ATOMA Pay adapter. The Afghan ATOMA public site documents merchant
 * registration and customer/merchant wallet payments, but does not publish
 * a public web checkout API specification. Therefore production endpoint
 * paths are configurable and MUST come from ATOMA's merchant onboarding/API
 * documentation rather than being guessed in source code.
 *
 * It also exposes an HMAC-SHA256 signature verifier for the webhook
 * callback (`X-Atoma-Signature` header over the raw request body).
 *
 * If ATOMA credentials are missing, the client operates in MOCK mode:
 * it returns deterministic fake payment sessions so local development
 * and CI can exercise the full flow without a real provider account.
 *
 * Environment variables:
 *   ATOMA_PAY_BASE_URL     - official ATOMA API base URL supplied by ATOMA
 *   ATOMA_PAY_CREATE_PATH  - payment creation path supplied by ATOMA (default /v1/payments)
 *   ATOMA_PAY_STATUS_PATH  - status path template supplied by ATOMA (default /v1/payments/:id)
 *   ATOMA_PAY_MERCHANT_ID  - your merchant identifier
 *   ATOMA_PAY_API_KEY      - server-side secret
 *   ATOMA_PAY_WEBHOOK_SECRET - HMAC secret for callback verification
 *   ATOMA_PAY_PUBLIC_BASE_URL - override for return/cancel URLs
 */
import crypto from 'crypto';
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
  mock: boolean;
}

export interface AtomaPayStatus {
  providerTxnId: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  amount?: Prisma.Decimal | string;
  currency?: string;
  paidAt?: string;
  failureReason?: string;
  raw: unknown;
  mock: boolean;
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
  return Boolean(c.baseUrl && c.merchantId && c.apiKey);
}

/** Create a hosted payment session. Falls back to mock when unconfigured. */
export async function createAtomaPaySession(
  input: AtomaPaySessionInput,
): Promise<AtomaPaySession> {
  const c = config();

  if (!isAtomaPayConfigured()) {
    if (process.env.APP_MODE !== 'demo') {
      throw new Error('ATOMA Pay is not configured (missing merchantId or apiKey)');
    }

    // MOCK: deterministic ID + a redirect that just bounces to the return URL.
    const providerTxnId = `mock_${input.orderReference}_${Date.now().toString(36)}`;
    const redirectUrl = `${input.returnUrl}${input.returnUrl.includes('?') ? '&' : '?'}mock=1&providerTxnId=${encodeURIComponent(providerTxnId)}&status=paid`;
    return {
      providerTxnId,
      redirectUrl,
      status: 'pending',
      raw: { mock: true, input },
      mock: true,
    };
  }

  const res = await fetch(`${c.baseUrl.replace(/\/$/, '')}${c.createPath.startsWith('/') ? c.createPath : `/${c.createPath}`}`, {
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
  });

  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (raw && typeof raw === 'object' && 'message' in raw && String((raw as { message: unknown }).message)) ||
      `ATOMA Pay returned HTTP ${res.status}`;
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
    throw new Error('ATOMA Pay response missing id or redirect_url');
  }
  return {
    providerTxnId,
    redirectUrl,
    status: (data.status as AtomaPaySession['status']) ?? 'pending',
    raw,
    mock: false,
  };
}

/** Verify status by provider transaction id. */
export async function verifyAtomaPayStatus(providerTxnId: string): Promise<AtomaPayStatus> {
  const c = config();

  if (!isAtomaPayConfigured() || providerTxnId.startsWith('mock_')) {
    if (process.env.APP_MODE !== 'demo' || !providerTxnId.startsWith('mock_')) {
      throw new Error('ATOMA Pay is not configured or mock verification is disabled');
    }
    // MOCK: any mock id we ever created is treated as paid.
    return {
      providerTxnId,
      status: 'paid',
      paidAt: new Date().toISOString(),
      raw: { mock: true },
      mock: true,
    };
  }


  const statusPath = c.statusPath.replace(':id', encodeURIComponent(providerTxnId));
  const res = await fetch(`${c.baseUrl.replace(/\/$/, '')}${statusPath.startsWith('/') ? statusPath : `/${statusPath}`}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${c.apiKey}`,
      'X-Merchant-Id': c.merchantId,
    },
  });
  const raw = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`ATOMA Pay verify HTTP ${res.status}`);

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

/**
 * Verify the HMAC-SHA256 signature ATOMA Pay attaches to webhook
 * callbacks. Callers pass the raw request body (as a string) and the
 * `X-Atoma-Signature` header.
 *
 * Uses timing-safe comparison to prevent signature-guessing.
 */
export function verifyAtomaPaySignature(rawBody: string, signature: string | null): boolean {
  const c = config();
  if (!c.webhookSecret) {
    // Fail closed in production — a missing secret means we cannot
    // authenticate the sender, so any webhook must be rejected.
    if (process.env.APP_MODE !== 'demo') return false;
    return true;
  }
  if (!signature) return false;
  const expected = crypto.createHmac('sha256', c.webhookSecret).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

