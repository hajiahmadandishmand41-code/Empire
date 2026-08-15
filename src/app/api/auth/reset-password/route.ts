import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, err } from '@/lib/api/response';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { consumeVerificationToken } from '@/lib/otp';
import { clientKey, rateLimitAsync, RATE_PRESETS } from '@/lib/api/rate-limit';
import { logger } from '@/lib/logger';

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  // Stage 3: rate-limit to slow token-guessing attacks.
  const rl = await rateLimitAsync(clientKey(req, 'auth:reset-password'), RATE_PRESETS.auth);
  if (!rl.ok) {
    logger.warn('auth.reset_password.rate_limited', { route: '/api/auth/reset-password' });
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
    return err('VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid input', 422);
  }

  const { token, password } = parsed.data;

  try {
    const userId = await consumeVerificationToken(token, 'password_reset');
    if (!userId) {
      return err('INVALID_TOKEN', 'توکن نامعتبر یا منقضی شده است', 400);
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    return ok({ message: 'رمز عبور با موفقیت تغییر کرد.' });
  } catch (e) {
    logger.error('auth.reset_password.error', { route: '/api/auth/reset-password' }, e);
    return err('INTERNAL_ERROR', 'خطای داخلی سرور', 500);
  }
}
