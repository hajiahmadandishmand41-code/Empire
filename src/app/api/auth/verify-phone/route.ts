import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, err } from '@/lib/api/response';
import { requireUserApi } from '@/lib/auth/guards';
import { prisma } from '@/lib/db';
import { consumeVerificationToken } from '@/lib/otp';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';
import { logger } from '@/lib/logger';

const schema = z.object({ otp: z.string().regex(/^\d{6}$/, 'OTP must be six digits') });
const VERIFY_LIMIT = { limit: 10, windowMs: 10 * 60_000 };

export async function POST(req: NextRequest) {
  const { user, response } = await requireUserApi();
  if (response) return response;

  const rl = await rateLimitAsync(
    clientKey(req, `auth:verify-phone:${user.id}`),
    VERIFY_LIMIT,
  );
  if (!rl.ok) return err('rate_limited', 'تلاش‌های زیاد. لطفاً بعداً دوباره تلاش کنید.', 429);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err('INVALID_JSON', 'Invalid request body', 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return err('VALIDATION_ERROR', 'کد OTP باید ۶ رقم باشد', 422);

  try {
    const userId = await consumeVerificationToken(parsed.data.otp, 'phone_otp', user.id);
    if (!userId) return err('INVALID_OTP', 'کد تأیید نادرست یا منقضی شده است', 400);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        phoneVerified: true,
        emailVerified: user.email ? true : undefined,
      },
    });
    return ok({ message: 'کد تأیید با موفقیت تأیید شد.' });
  } catch (error) {
    logger.error('auth.verify_phone.error', { userId: user.id }, error);
    return err('INTERNAL_ERROR', 'خطای داخلی سرور', 500);
  }
}
