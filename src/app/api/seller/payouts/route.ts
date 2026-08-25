/** Seller payout API. */
import type { NextRequest } from 'next/server';
import crypto from 'node:crypto';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import { requestPayout, PayoutError } from '@/lib/finance/wallet';
import { listSellerPayouts } from '@/features/seller/lib/wallet-queries';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';

export const dynamic = 'force-dynamic';

const payoutSchema = z.object({
  amount: z.string().regex(/^\d+(?:\.\d{1,2})?$/).refine((v) => { try { const d = new Prisma.Decimal(v); return d.gt(0) && d.lte(1_000_000); } catch { return false; } }, 'Invalid amount'),
  method: z.enum(['bank_transfer', 'cash', 'whatsapp', 'atoma_pay']),
  accountInfo: z.string().min(3).max(500),
  sellerNote: z.string().max(500).optional(),
});

export async function OPTIONS() { return jsonPreflight(); }
export async function GET() {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  return jsonOk({ payouts: await listSellerPayouts(guard.user.id) });
}

export async function POST(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'seller:payouts:create'), { limit: 5, windowMs: 60_000 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('invalid_json', 'Invalid JSON', { status: 400 }); }
  const parsed = payoutSchema.safeParse(body);
  if (!parsed.success) return jsonError('invalid_body', 'اطلاعات درخواست نامعتبر است.', { status: 422, details: { issues: parsed.error.issues } });
  const headerKey = req.headers.get('idempotency-key')?.trim();
  const requestKey = headerKey && headerKey.length >= 16 && headerKey.length <= 128 ? headerKey : crypto.randomUUID();
  try {
    const payout = await requestPayout(guard.user.id, { ...parsed.data, requestKey });
    return jsonOk({ payout }, { status: 201 });
  } catch (err) {
    if (err instanceof PayoutError) return jsonError(err.code, err.message, { status: 400 });
    console.error('[seller/payouts.POST]', err);
    return jsonError('payout_failed', 'ثبت درخواست برداشت با خطا مواجه شد.', { status: 500 });
  }
}
