import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, err } from '@/lib/api/response';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { createVerificationToken, consumeVerificationToken } from '@/lib/otp';
import { sendOtpLogin } from '@/lib/sms';
import { setSessionCookie } from '@/lib/auth/session';
import { clientKey, rateLimitAsync, RATE_PRESETS } from '@/lib/api/rate-limit';
import { logger } from '@/lib/logger';

// Step 1: send OTP
const sendSchema = z.object({
  phone: z.string().min(7),
  step: z.literal('send'),
});

// Step 2: verify OTP and login
const verifySchema = z.object({
  phone: z.string().min(7),
  step: z.literal('verify'),
  otp: z.string().length(6),
});

const schema = z.discriminatedUnion('step', [sendSchema, verifySchema]);

export async function POST(req: NextRequest) {
  // Stage 3: rate-limit OTP login to prevent brute-force (10 attempts / 60 s per IP).
  const rl = await rateLimitAsync(clientKey(req, 'auth:otp-login'), RATE_PRESETS.auth);
  if (!rl.ok) {
    logger.warn('auth.otp_login.rate_limited', { route: '/api/auth/otp-login' });
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

  const data = parsed.data;

  if (!isDatabaseConfigured()) {
    if (data.step === 'send') return ok({ message: 'کد OTP ارسال شد.' });
    if (data.step === 'verify') {
      await setSessionCookie('mock-user');
      return ok({ user: { id: 'mock-user', phone: data.phone, role: 'customer' } });
    }
  }

  try {
    if (data.step === 'send') {
      const user = await prisma.user.findUnique({ where: { phone: data.phone } });
      if (!user) return ok({ message: 'کد OTP ارسال شد.' }); // anti-enumeration
      if (!user.isActive) return err('ACCOUNT_DISABLED', 'حساب غیرفعال است', 403);

      const otp = await createVerificationToken(user.id, 'otp_login', 10);
      await sendOtpLogin(data.phone, otp);
      return ok({ message: 'کد OTP ارسال شد.' });
    }

    // step === 'verify'
    const user = await prisma.user.findUnique({
      where: { phone: data.phone },
      select: { id: true, phone: true, fullName: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) return err('INVALID_OTP', 'کد تأیید نادرست است', 401);

    const userId = await consumeVerificationToken(data.otp, 'otp_login');
    if (!userId || userId !== user.id) {
      return err('INVALID_OTP', 'کد تأیید نادرست یا منقضی شده است', 401);
    }

    await setSessionCookie(user.id);
    return ok({ user });
  } catch (e) {
    logger.error('auth.otp_login.error', { route: '/api/auth/otp-login' }, e);
    return err('INTERNAL_ERROR', 'خطای داخلی سرور', 500);
  }
}
