import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, err } from '@/lib/api/response';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { createVerificationToken, consumeVerificationToken } from '@/lib/otp';
import { sendOtpToEmailAndPhone } from '@/lib/otp-delivery';
import { setSessionCookie } from '@/lib/auth/session';
import { clientKey, rateLimitAsync, RATE_PRESETS } from '@/lib/api/rate-limit';
import { logger } from '@/lib/logger';

const sendSchema = z.object({ phone: z.string().trim().min(7).max(32), step: z.literal('send') });
const verifySchema = z.object({ phone: z.string().trim().min(7).max(32), step: z.literal('verify'), otp: z.string().regex(/^\d{6}$/) });
const schema = z.discriminatedUnion('step', [sendSchema, verifySchema]);
const VERIFY_LIMIT = { limit: 10, windowMs: 10 * 60_000 };

export async function POST(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'auth:otp-login'), RATE_PRESETS.auth);
  if (!rl.ok) {
    const response = err('rate_limited', 'Too many attempts. Please try again later.', 429);
    response.headers.set('Retry-After', String(Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))));
    return response;
  }

  if (!isDatabaseConfigured()) {
    logger.error('auth.otp_login.no_database', { route: '/api/auth/otp-login' });
    return err('service_unavailable', 'Authentication service is temporarily unavailable.', 503);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err('INVALID_JSON', 'Request body is not valid JSON.', 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return err('VALIDATION_ERROR', 'Invalid OTP request.', 422);

  const data = parsed.data;

  try {
    if (data.step === 'send') {
      const user = await prisma.user.findUnique({
        where: { phone: data.phone },
        select: { id: true, email: true, phone: true, isActive: true },
      });

      // Avoid user enumeration: always return the same success response for a
      // syntactically valid phone number, but only generate/send an OTP for a
      // real active account.
      if (!user || !user.isActive) {
        return ok({ message: 'If this phone is registered, a verification code has been sent.', expiresInSeconds: 600 });
      }

      const otp = await createVerificationToken(user.id, 'otp_login', 10);
      await sendOtpToEmailAndPhone(otp, { email: user.email, phone: user.phone });
      return ok({
        message: user.email ? 'A verification code was sent to your email and phone.' : 'A verification code was sent to your phone.',
        expiresInSeconds: 600,
      });
    }

    const verifyRl = await rateLimitAsync(clientKey(req, `auth:otp-login-verify:${data.phone}`), VERIFY_LIMIT);
    if (!verifyRl.ok) return err('rate_limited', 'Too many verification attempts. Please try again later.', 429);

    const user = await prisma.user.findUnique({
      where: { phone: data.phone },
      select: { id: true, phone: true, email: true, fullName: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) return err('INVALID_OTP', 'The verification code is invalid or expired.', 401);

    const userId = await consumeVerificationToken(data.otp, 'otp_login', user.id);
    if (!userId) return err('INVALID_OTP', 'The verification code is invalid or expired.', 401);

    await setSessionCookie(user.id);
    return ok({ user });
  } catch (error) {
    logger.error('auth.otp_login.error', { route: '/api/auth/otp-login' }, error);
    return err('DELIVERY_FAILED', 'OTP processing failed. Please try again.', 503);
  }
}
