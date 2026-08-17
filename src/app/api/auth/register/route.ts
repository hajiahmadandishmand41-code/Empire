import type { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonOk, jsonError, jsonPreflight } from '@/lib/api/response';
import { setSessionCookie } from '@/lib/auth/session';
import { registerSchema, parseIdentifier } from '@/lib/auth/schemas';
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
  const rl = await rateLimitAsync(clientKey(req, 'auth:register'), RATE_PRESETS.auth);
  if (!rl.ok) {
    logger.warn('auth.register.rate_limited', { route: '/api/auth/register' });
    const response = jsonError('rate_limited', 'Too many attempts. Please try again later.', { status: 429 });
    response.headers.set('Retry-After', String(Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))));
    response.headers.set('X-RateLimit-Limit', String(rl.limit));
    response.headers.set('X-RateLimit-Remaining', '0');
    return response;
  }

  if (!isDatabaseConfigured()) {
    logger.error('auth.register.no_database', {
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

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('VALIDATION_ERROR', 'Invalid registration payload.', {
      status: 422,
      details: { issues: parsed.error.flatten() },
    });
  }

  const id = parseIdentifier(parsed.data.identifier);
  if (!id) {
    return jsonError('VALIDATION_ERROR', 'Email or phone number is invalid.', { status: 422 });
  }

  const passwordHash = await (await import('@/lib/auth/password')).hashPassword(parsed.data.password);

  try {
    const user = await prisma.user.create({
      data: {
        fullName: parsed.data.fullName.trim(),
        email: id.email,
        phone: id.phone,
        passwordHash,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    await setSessionCookie(user.id);

    return jsonOk({ user }, { status: 201 });
  } catch (error) {
    if (isKnownPrismaError(error) && error.code === 'P2002') {
      return jsonError('USER_EXISTS', 'An account with this email or phone already exists.', { status: 409 });
    }
    logger.error('auth.register.create_failed', {
      code: isKnownPrismaError(error) ? error.code : 'UNKNOWN',
    }, error);
    return databaseUnavailable();
  }
}
