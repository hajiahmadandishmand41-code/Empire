import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, err } from '@/lib/api/response';
import { hashPassword } from '@/lib/auth/password';
import { consumePasswordResetAndUpdatePassword } from '@/lib/otp';
import { clientKey, rateLimitAsync, RATE_PRESETS } from '@/lib/api/rate-limit';
import { logger } from '@/lib/logger';

const schema = z.object({
  token: z.string().min(1).max(256),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'auth:reset-password'), RATE_PRESETS.auth);
  if (!rl.ok) {
    logger.warn('auth.reset_password.rate_limited', { route: '/api/auth/reset-password' });
    const response = err('rate_limited', 'Too many attempts. Please try again later.', 429);
    response.headers.set('Retry-After', String(Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))));
    return response;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err('INVALID_JSON', 'Request body is not valid JSON.', 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return err('VALIDATION_ERROR', 'Invalid password reset payload.', 422);
  }

  try {
    const passwordHash = await hashPassword(parsed.data.password);
    const userId = await consumePasswordResetAndUpdatePassword(parsed.data.token, passwordHash);

    if (!userId) {
      return err('INVALID_TOKEN', 'The reset link is invalid or expired.', 400);
    }

    return ok({ message: 'Password changed successfully.' });
  } catch (error) {
    logger.error('auth.reset_password.error', { route: '/api/auth/reset-password' }, error);
    return err('INTERNAL_ERROR', 'Internal server error.', 500);
  }
}
