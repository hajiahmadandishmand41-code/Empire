import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/response';
import { requireUserApi } from '@/lib/auth/guards';
import { createVerificationToken } from '@/lib/otp';
import { sendPhoneOtp } from '@/lib/sms';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';
import { logger } from '@/lib/logger';

// Tighter limit: 5 SMS / minute per user to prevent SMS-bombing.
const SMS_LIMIT = { limit: 5, windowMs: 60_000 };

export async function POST(req: NextRequest) {
  const { user, response } = await requireUserApi();
  if (response) return response;

  // Stage 3: per-user rate limit to prevent SMS-bombing via this endpoint.
  const rl = await rateLimitAsync(clientKey(req, `auth:send-phone-otp:${user.id}`), SMS_LIMIT);
  if (!rl.ok) {
    logger.warn('auth.send_phone_otp.rate_limited', {
      userId: user.id,
      route: '/api/auth/send-phone-otp',
    });
    return err('rate_limited', 'تلاش‌های زیاد. کمی بعد دوباره امتحان کنید.', 429);
  }

  if (!user.phone) return err('NO_PHONE', 'این حساب شماره تلفن ندارد', 400);
  if (user.phoneVerified) return err('ALREADY_VERIFIED', 'شماره تلفن قبلاً تأیید شده است', 400);

  try {
    const otp = await createVerificationToken(user.id, 'phone_otp', 10);
    await sendPhoneOtp(user.phone, otp);
    return ok({ message: 'کد تأیید ارسال شد.' });
  } catch (e) {
    logger.error('auth.send_phone_otp.error', {
      userId: user.id,
      route: '/api/auth/send-phone-otp',
    }, e);
    return err('INTERNAL_ERROR', 'خطای داخلی سرور', 500);
  }
}
