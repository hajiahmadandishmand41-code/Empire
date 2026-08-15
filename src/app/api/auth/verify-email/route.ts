import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, err } from '@/lib/api/response';
import { prisma } from '@/lib/db';
import { consumeVerificationToken } from '@/lib/otp';
import { logger } from '@/lib/logger';

const schema = z.object({ token: z.string().min(1) });

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err('INVALID_JSON', 'Invalid request body', 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return err('VALIDATION_ERROR', 'توکن نامعتبر است', 422);

  const { token } = parsed.data;

  try {
    const userId = await consumeVerificationToken(token, 'email_verification');
    if (!userId) return err('INVALID_TOKEN', 'توکن نامعتبر یا منقضی شده است', 400);

    await prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });
    return ok({ message: 'ایمیل با موفقیت تأیید شد.' });
  } catch (e) {
    logger.error('auth.verify_email.error', { route: '/api/auth/verify-email' }, e);
    return err('INTERNAL_ERROR', 'خطای داخلی سرور', 500);
  }
}

/**
 * GET: Email link click handler.
 *
 * Guards against automated prefetch requests (mail scanners, link
 * preloaders) that could consume the one-time token before the user
 * actually clicks the link. Requests advertising themselves as
 * prefetch or preview operations are rejected with 403 so the token
 * is preserved for the real user visit.
 */
export async function GET(req: NextRequest) {
  // Block prefetch/preview requests from email clients / scanners that
  // would silently consume the one-time token.
  const purposeHeader =
    req.headers.get('x-purpose') ??
    req.headers.get('purpose') ??
    req.headers.get('x-moz') ??
    '';
  if (purposeHeader === 'prefetch' || purposeHeader === 'preview') {
    return err('PREFETCH_BLOCKED', 'Prefetch requests cannot consume verification tokens.', 403);
  }

  const token = req.nextUrl.searchParams.get('token');
  if (!token) return err('MISSING_TOKEN', 'توکن الزامی است', 400);
  return POST(
    new NextRequest(req.url, { method: 'POST', body: JSON.stringify({ token }) }),
  );
}
