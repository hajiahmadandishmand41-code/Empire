import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, err } from '@/lib/api/response';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { createVerificationToken } from '@/lib/otp';
import { sendPasswordResetEmail } from '@/lib/email';
import { clientKey, rateLimitAsync, RATE_PRESETS } from '@/lib/api/rate-limit';
import { logger } from '@/lib/logger';

const schema = z.object({
  email: z.string().email(),
  locale: z.string().default('fa'),
});

export async function POST(req: NextRequest) {
  // Stage 3: rate-limit to prevent email-bombing via this unauthenticated endpoint.
  const rl = await rateLimitAsync(clientKey(req, 'auth:forgot-password'), RATE_PRESETS.auth);
  if (!rl.ok) {
    logger.warn('auth.forgot_password.rate_limited', { route: '/api/auth/forgot-password' });
    return err('rate_limited', 'تلاش‌های زیاد. کمی بعد دوباره امتحان کنید.', 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err('INVALID_JSON', 'Invalid request body', 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return err('VALIDATION_ERROR', 'آدرس ایمیل نامعتبر است', 422);
  }

  const { email, locale } = parsed.data;

  // Always return success to prevent email enumeration.
  if (!isDatabaseConfigured()) {
    return ok({ message: 'اگر این ایمیل ثبت شده باشد، لینک بازیابی ارسال خواهد شد.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && user.isActive) {
      const token = await createVerificationToken(user.id, 'password_reset', 30);
      await sendPasswordResetEmail(email, token, locale).catch((e) =>
        logger.error('auth.forgot_password.email_send_failed', { route: '/api/auth/forgot-password' }, e),
      );
    }
    return ok({ message: 'اگر این ایمیل ثبت شده باشد، لینک بازیابی ارسال خواهد شد.' });
  } catch (e) {
    logger.error('auth.forgot_password.error', { route: '/api/auth/forgot-password' }, e);
    return err('INTERNAL_ERROR', 'خطای داخلی سرور', 500);
  }
}
