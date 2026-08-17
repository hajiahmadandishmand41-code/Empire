import type { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonOk, jsonError, jsonPreflight } from '@/lib/api/response';
import { verifyPassword } from '@/lib/auth/password';
import { setSessionCookie } from '@/lib/auth/session';
import { loginSchema, parseIdentifier } from '@/lib/auth/schemas';
import { clientKey, rateLimitAsync, RATE_PRESETS } from '@/lib/api/rate-limit';
import { logger } from '@/lib/logger';

export async function OPTIONS() {
  return jsonPreflight();
}

function isKnownPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

function databaseUnavailable(): ReturnType<typeof jsonError> {
  return jsonError('service_unavailable', 'Authentication service is temporarily unavailable.', {
    status: 503,
  });
}

export async function POST(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'auth:login'), RATE_PRESETS.auth);
  if (!rl.ok) {
    logger.warn('auth.login.rate_limited', { route: '/api/auth/login' });
    const response = jsonError('rate_limited', 'Too many attempts. Please try again later.', { status: 429 });
    response.headers.set('Retry-After', String(Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))));
    response.headers.set('X-RateLimit-Limit', String(rl.limit));
    response.headers.set('X-RateLimit-Remaining', '0');
    return response;
  }

  if (!isDatabaseConfigured()) {
    logger.error('auth.login.no_database', {
      message: 'A supported production database URL is not configured.',
      nodeEnv: process.env.NODE_ENV,
    });
    return databaseUnavailable();
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('BAD_JSON', 'Request body is not valid JSON.', { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('VALIDATION_ERROR', 'Invalid credentials payload.', {
      status: 422,
      details: { issues: parsed.error.flatten() },
    });
  }

  const id = parseIdentifier(parsed.data.identifier);
  if (!id) {
    return jsonError('INVALID_CREDENTIALS', 'Email/phone or password is incorrect.', { status: 401 });
  }

  let user: Awaited<ReturnType<typeof prisma.user.findFirst>>;
  try {
    user = await prisma.user.findFirst({
      where: id.email ? { email: id.email } : { phone: id.phone! },
    });
  } catch (error) {
    logger.error('auth.login.lookup_failed', {
      code: isKnownPrismaError(error) ? error.code : 'UNKNOWN',
    });
    return databaseUnavailable();
  }

  if (!user) {
    return jsonError('INVALID_CREDENTIALS', 'Email/phone or password is incorrect.', { status: 401 });
  }

  if (user.isActive === false) {
    return jsonError('ACCOUNT_DISABLED', 'This account is disabled. Please contact support.', { status: 403 });
  }

  let ok = false;
  try {
    ok = await verifyPassword(parsed.data.password, user.passwordHash);
  } catch (error) {
    logger.error('auth.login.password_verify_failed', {
      code: isKnownPrismaError(error) ? error.code : 'UNKNOWN',
    });
    return databaseUnavailable();
  }
  if (!ok) {
    return jsonError('INVALID_CREDENTIALS', 'Email/phone or password is incorrect.', { status: 401 });
  }

  try {
    await setSessionCookie(user.id);
  } catch (error) {
    logger.error('auth.login.session_failed', { code: 'SESSION_SETUP_FAILED' }, error);
    return databaseUnavailable();
  }

  return jsonOk({
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  });
}
