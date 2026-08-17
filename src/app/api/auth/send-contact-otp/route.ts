import { NextRequest } from 'next/server';
import { ok, err } from '@/lib/api/response';
import { requireUserApi } from '@/lib/auth/guards';
import { createVerificationToken } from '@/lib/otp';
import { sendOtpToEmailAndPhone } from '@/lib/otp-delivery';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';
import { logger } from '@/lib/logger';

const SEND_LIMIT = { limit: 3, windowMs: 10 * 60_000 };

export async function POST(req: NextRequest) {
  const { user, response } = await requireUserApi();
  if (response) return response;

  const rl = await rateLimitAsync(
    clientKey(req, `auth:send-contact-otp:${user.id}`),
    SEND_LIMIT,
  );
  if (!rl.ok) {
    return err('rate_limited', 'تلاش‌های زیاد. لطفاً بعداً دوباره امتحان کنید.', 429);
  }

  if (!user.email && !user.phone) {
    return err('NO_CONTACT', 'برای ارسال کد، ایمیل یا شماره تلفن لازم است.', 400);
  }

  try {
    const otp = await createVerificationToken(user.id, 'phone_otp', 10);
    await sendOtpToEmailAndPhone(otp, { email: user.email, phone: user.phone });
    return ok({
      message: 'کد تأیید به ایمیل و شماره تلفن شما ارسال شد.',
      expiresInSeconds: 600,
    });
  } catch (error) {
    logger.error('auth.send_contact_otp.error', { userId: user.id }, error);
    return err('DELIVERY_FAILED', 'ارسال کد تأیید انجام نشد. لطفاً دوباره تلاش کنید.', 503);
  }
}
