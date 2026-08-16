import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, err } from '@/lib/api/response';
import { requireUserApi } from '@/lib/auth/guards';
import { prisma } from '@/lib/db';
import { consumeVerificationToken } from '@/lib/otp';
import { logger } from '@/lib/logger';

const schema = z.object({ otp: z.string().length(6) });

export async function POST(req: NextRequest) {
  const { user, response } = await requireUserApi();
  if (response) return response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err('INVALID_JSON', 'Invalid request body', 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return err('VALIDATION_ERROR', 'کد OTP باید ۶ رقم باشد', 422);

  const { otp } = parsed.data;

  try {
    const userId = await consumeVerificationToken(otp, 'phone_otp', user.id);
    if (!userId) {
      return err('INVALID_OTP', 'کد تأیید نادرست یا منقضی شده است', 400);
    }
    await prisma.user.update({ where: { id: user.id }, data: { phoneVerified: true } });
    return ok({ message: 'شماره تلفن با موفقیت تأیید شد.' });
  } catch (e) {
    logger.error('auth.verify_phone.error', { userId: user.id, route: '/api/auth/verify-phone' }, e);
    return err('INTERNAL_ERROR', 'خطای داخلی سرور', 500);
  }
}
