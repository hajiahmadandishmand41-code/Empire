import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, err } from '@/lib/api/response';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { createVerificationToken, consumeVerificationToken } from '@/lib/otp';
import { sendOtpToEmailAndPhone } from '@/lib/otp-delivery';
import { setSessionCookie } from '@/lib/auth/session';
import { clientKey, rateLimitAsync, RATE_PRESETS } from '@/lib/api/rate-limit';
import { logger } from '@/lib/logger';

const sendSchema = z.object({ phone: z.string().min(7), step: z.literal('send') });
const verifySchema = z.object({ phone: z.string().min(7), step: z.literal('verify'), otp: z.string().regex(/^\d{6}$/) });
const schema = z.discriminatedUnion('step', [sendSchema, verifySchema]);
const VERIFY_LIMIT = { limit: 10, windowMs: 10 * 60_000 };

function mockAuthEnabled(): boolean {
  return process.env.NODE_ENV === 'development' && process.env.ALLOW_MOCK_AUTH === 'true';
}

export async function POST(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'auth:otp-login'), RATE_PRESETS.auth);
  if (!rl.ok) return err('rate_limited', 'تلاش‌های زیاد. کمی بعد دوباره تلاش کنید.', 429);

  if (!isDatabaseConfigured() && !mockAuthEnabled()) {
    logger.error('auth.otp_login.no_database', { route: '/api/auth/otp-login' });
    return err('service_unavailable', 'سرویس در حال حاضر در دسترس نیست. لطفاً بعداً تلاش کنید.', 503);
  }

  let body: unknown;
  try { body = await req.json(); } catch { return err('INVALID_JSON', 'Invalid request body', 400); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return err('VALIDATION_ERROR', 'اطلاعات OTP نامعتبر است', 422);

  const data = parsed.data;

  if (!isDatabaseConfigured()) {
    if (data.step === 'send') return ok({ message: 'کد OTP ارسال شد.', expiresInSeconds: 600 });
    await setSessionCookie('mock-user');
    return ok({ user: { id: 'mock-user', phone: data.phone, role: 'customer' } });
  }

  try {
    if (data.step === 'send') {
      const user = await prisma.user.findUnique({
        where: { phone: data.phone },
        select: { id: true, email: true, phone: true, isActive: true },
      });
      if (!user) return ok({ message: 'کد OTP ارسال شد.', expiresInSeconds: 600 });
      if (!user.isActive) return err('ACCOUNT_DISABLED', 'حساب غیرفعال است', 403);

      const otp = await createVerificationToken(user.id, 'otp_login', 10);
      await sendOtpToEmailAndPhone(otp, { email: user.email, phone: user.phone });
      return ok({
        message: user.email ? 'کد یکسان به ایمیل و شماره تلفن شما ارسال شد.' : 'کد OTP به شماره تلفن شما ارسال شد.',
        expiresInSeconds: 600,
      });
    }

    const verifyRl = await rateLimitAsync(clientKey(req, `auth:otp-login-verify:${data.phone}`), VERIFY_LIMIT);
    if (!verifyRl.ok) return err('rate_limited', 'تلاش‌های زیاد. لطفاً بعداً دوباره تلاش کنید.', 429);

    const user = await prisma.user.findUnique({
      where: { phone: data.phone },
      select: { id: true, phone: true, email: true, fullName: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) return err('INVALID_OTP', 'کد تأیید نادرست است', 401);

    const userId = await consumeVerificationToken(data.otp, 'otp_login', user.id);
    if (!userId) return err('INVALID_OTP', 'کد تأیید نادرست یا منقضی شده است', 401);

    await setSessionCookie(user.id);
    return ok({ user });
  } catch (error) {
    logger.error('auth.otp_login.error', { route: '/api/auth/otp-login' }, error);
    return err('DELIVERY_FAILED', 'پردازش OTP انجام نشد. لطفاً دوباره تلاش کنید.', 503);
  }
}
