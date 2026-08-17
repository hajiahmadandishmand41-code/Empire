import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/response';
import { requireUserApi } from '@/lib/auth/guards';
import { createVerificationToken } from '@/lib/otp';
import { sendOtpToEmailAndPhone } from '@/lib/otp-delivery';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';
import { logger } from '@/lib/logger';

const OTP_SEND_LIMIT = { limit: 3, windowMs: 10 * 60_000 };

export async function POST(req: NextRequest) {
  const { user, response } = await requireUserApi();
  if (response) return response;

  const rl = await rateLimitAsync(
    clientKey(req, `auth:send-phone-otp:${user.id}`),
    OTP_SEND_LIMIT,
  );
  if (!rl.ok) {
    logger.warn('auth.send_phone_otp.rate_limited', { userId: user.id });
    return err('rate_limited', 'تلاش‌های زیاد. لطفاً بعداً دوباره تلاش کنید.', 429);
  }

  if (!user.phone) return err('NO_PHONE', 'این حساب شماره تلفن ندارد', 400);
  if (user.phoneVerified) return err('ALREADY_VERIFIED', 'شماره تلفن قبلاً تأیید شده است', 400);

  try {
    const otp = await createVerificationToken(user.id, 'phone_otp', 10);
    await sendOtpToEmailAndPhone(otp, { email: user.email, phone: user.phone });
    return ok({ message: 'کد یکسان به ایمیل و شماره تلفن شما ارسال شد.', expiresInSeconds: 600 });
  } catch (error) {
    logger.error('auth.send_phone_otp.error', { userId: user.id }, error);
    return err('DELIVERY_FAILED', 'ارسال کد تأیید انجام نشد. لطفاً دوباره تلاش کنید.', 503);
  }
}
