import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, err } from '@/lib/api/response';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { createVerificationToken } from '@/lib/otp';
import { sendPasswordResetEmail } from '@/lib/email';
import { clientKey, rateLimitAsync, RATE_PRESETS } from '@/lib/api/rate-limit';
import { logger } from '@/lib/logger';

const schema = z.object({
  email: z.string().trim().email().max(254),
  locale: z.enum(['fa', 'ps', 'en']).default('fa'),
});

export async function POST(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'auth:forgot-password'), RATE_PRESETS.auth);
  if (!rl.ok) {
    logger.warn('auth.forgot_password.rate_limited', { route: '/api/auth/forgot-password' });
    const response = err('rate_limited', 'Too many attempts. Please try again later.', 429);
    response.headers.set('Retry-After', String(Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))));
    return response;
  }

  if (!isDatabaseConfigured()) {
    logger.error('auth.forgot_password.no_database', { route: '/api/auth/forgot-password' });
    return err('service_unavailable', 'Password reset service is temporarily unavailable.', 503);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err('INVALID_JSON', 'Request body is not valid JSON.', 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return err('VALIDATION_ERROR', 'Enter a valid email address.', 422);

  const { email, locale } = parsed.data;

  // Keep the same public response for existing/non-existing addresses to avoid
  // account enumeration. Delivery failures are returned as service failures
  // instead of pretending that an email was sent.
  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user && user.isActive) {
      const token = await createVerificationToken(user.id, 'password_reset', 30);
      await sendPasswordResetEmail(email.toLowerCase(), token, locale);
    }
    return ok({ message: 'If this email is registered, a password reset link will be sent.' }, 202);
  } catch (error) {
    logger.error('auth.forgot_password.error', { route: '/api/auth/forgot-password' }, error);
    return err('DELIVERY_FAILED', 'Password reset email could not be sent. Please try again later.', 503);
  }
}
