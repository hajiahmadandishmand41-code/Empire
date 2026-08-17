import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, err } from '@/lib/api/response';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { consumeVerificationToken } from '@/lib/otp';
import { logger } from '@/lib/logger';
import { clientKey, rateLimitAsync, RATE_PRESETS } from '@/lib/api/rate-limit';

const schema = z.object({ token: z.string().min(1).max(256) });

export async function POST(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'auth:verify-email'), RATE_PRESETS.auth);
  if (!rl.ok) {
    const response = err('rate_limited', 'Too many attempts. Please try again later.', 429);
    response.headers.set('Retry-After', String(Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))));
    return response;
  }

  if (!isDatabaseConfigured()) return err('service_unavailable', 'Authentication service is temporarily unavailable.', 503);

  let body: unknown;
  try { body = await req.json(); } catch { return err('INVALID_JSON', 'Invalid request body', 400); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return err('VALIDATION_ERROR', 'Invalid verification token', 422);

  try {
    const userId = await consumeVerificationToken(parsed.data.token, 'email_verification');
    if (!userId) return err('INVALID_TOKEN', 'Verification token is invalid or expired', 400);

    await prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });
    return ok({ message: 'EMAIL_VERIFIED' });
  } catch (error) {
    logger.error('auth.verify_email.error', { route: '/api/auth/verify-email' }, error);
    return err('INTERNAL_ERROR', 'Internal server error', 500);
  }
}

export async function GET(req: NextRequest) {
  const purposeHeader = req.headers.get('x-purpose') ?? req.headers.get('purpose') ?? req.headers.get('x-moz') ?? '';
  if (purposeHeader === 'prefetch' || purposeHeader === 'preview') {
    return err('PREFETCH_BLOCKED', 'Prefetch requests cannot consume verification tokens.', 403);
  }

  const token = req.nextUrl.searchParams.get('token');
  if (!token) return err('MISSING_TOKEN', 'Verification token is required', 400);

  return POST(new NextRequest(req.url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token }),
  }));
}
