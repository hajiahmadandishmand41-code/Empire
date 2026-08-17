import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, err } from '@/lib/api/response';
import { requireUserApi } from '@/lib/auth/guards';
import { consumeVerificationToken } from '@/lib/otp';
import { prisma } from '@/lib/db';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';
import { logger } from '@/lib/logger';

const schema = z.object({ otp: z.string().regex(/^\d{6}$/, 'OTP must be six digits') });
const VERIFY_LIMIT = { limit: 10, windowMs: 10 * 60_000 };

export async function POST(req: NextRequest) {
  const { user, response } = await requireUserApi();
  if (response) return response;

  const rl = await rateLimitAsync(
    clientKey(req, `auth:verify-contact-otp:${user.id}`),
    VERIFY_LIMIT,
  );
  if (!rl.ok) return err('rate_limited', 'تلاش‌های زیاد. لطفاً بعداً دوباره تلاش کنید.', 429);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err('INVALID_JSON', 'بدنه درخواست نامعتبر است', 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return err('VALIDATION_ERROR', 'کد OTP باید ۶ رقم باشد', 422);

  try {
    const userId = await consumeVerificationToken(parsed.data.otp, 'phone_otp', user.id);
    if (!userId) return err('INVALID_OTP', 'کد تأیید نادرست یا منقضی شده است', 400);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: user.email ? true : undefined,
        phoneVerified: user.phone ? true : undefined,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        emailVerified: true,
        phoneVerified: true,
      },
    });

    return ok({
      message: 'کد تأیید با موفقیت تأیید شد.',
      user: updated,
    });
  } catch (error) {
    logger.error('auth.verify_contact_otp.error', { userId: user.id }, error);
    return err('INTERNAL_ERROR', 'خطای داخلی سرور', 500);
  }
}
