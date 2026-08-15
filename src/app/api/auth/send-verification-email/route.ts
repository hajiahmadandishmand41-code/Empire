import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, err } from '@/lib/api/response';
import { requireUserApi } from '@/lib/auth/guards';
import { prisma } from '@/lib/db';
import { createVerificationToken } from '@/lib/otp';
import { sendEmailVerificationEmail } from '@/lib/email';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';
import { logger } from '@/lib/logger';

const schema = z.object({ locale: z.string().default('fa') });

// Dedicated rate-limit for email sending: tighter than the global auth preset
// to prevent using this endpoint as an email-bombing relay.
const EMAIL_VERIFY_LIMIT = { limit: 5, windowMs: 60_000 };

export async function POST(req: NextRequest) {
  const { user, response } = await requireUserApi();
  if (response) return response;

  // Stage 3: per-user rate limit to prevent email-bombing via this endpoint.
  const rl = await rateLimitAsync(clientKey(req, `auth:send-verify-email:${user.id}`), EMAIL_VERIFY_LIMIT);
  if (!rl.ok) {
    logger.warn('auth.send_verification_email.rate_limited', {
      userId: user.id,
      route: '/api/auth/send-verification-email',
    });
    return err('rate_limited', 'تلاش‌های زیاد. کمی بعد دوباره امتحان کنید.', 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const { locale } = schema.parse(body);

  if (!user.email) return err('NO_EMAIL', 'این حساب ایمیل ندارد', 400);
  if (user.emailVerified) return err('ALREADY_VERIFIED', 'ایمیل قبلاً تأیید شده است', 400);

  try {
    const token = await createVerificationToken(user.id, 'email_verification', 24 * 60);
    await sendEmailVerificationEmail(user.email, token, locale);
    return ok({ message: 'ایمیل تأیید ارسال شد.' });
  } catch (e) {
    logger.error('auth.send_verification_email.error', {
      userId: user.id,
      route: '/api/auth/send-verification-email',
    }, e);
    return err('INTERNAL_ERROR', 'خطای داخلی سرور', 500);
  }
}
