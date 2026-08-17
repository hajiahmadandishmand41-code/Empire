import type { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonOk, jsonError, jsonPreflight } from '@/lib/api/response';
import { setSessionCookie } from '@/lib/auth/session';
import { registerSchema, parseIdentifier } from '@/lib/auth/schemas';
import { createMockUser, findMockUser } from '@/lib/auth/mock-users';
import { clientKey, rateLimitAsync, RATE_PRESETS } from '@/lib/api/rate-limit';
import { logger } from '@/lib/logger';

export async function OPTIONS() {
  return jsonPreflight();
}

function isKnownPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

function databaseUnavailable(): ReturnType<typeof jsonError> {
  return jsonError('service_unavailable', 'سرویس در حال حاضر در دسترس نیست. لطفاً بعداً تلاش کنید.', {
    status: 503,
  });
}

export async function POST(req: NextRequest) {
  // Phase 10.2 — strict rate limit to mitigate mass account creation.
  const rl = await rateLimitAsync(clientKey(req, 'auth:register'), RATE_PRESETS.auth);
  if (!rl.ok) {
    logger.warn('auth.register.rate_limited', { route: '/api/auth/register' });
    return jsonError('rate_limited', 'تلاش‌های زیاد. کمی بعد دوباره امتحان کنید.', {
      status: 429,
    });
  }

  // Fail-fast: in production/staging, DATABASE_URL is mandatory.
  // Mock auth is development-only; running without a real DB in production
  // is a critical misconfiguration.
  if (!isDatabaseConfigured()) {
    const env = process.env.NODE_ENV;
    if (env === 'production' || (env !== 'development' && process.env.ALLOW_MOCK_AUTH !== 'true')) {
      logger.error('auth.register.no_database', {
        message: 'DATABASE_URL is not set. Auth is disabled outside development.',
        nodeEnv: env,
      });
      return databaseUnavailable();
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('BAD_JSON', 'بدنه‌ی درخواست نامعتبر است', { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('VALIDATION_ERROR', 'ورودی نامعتبر است', {
      status: 422,
      details: { issues: parsed.error.flatten() },
    });
  }

  const id = parseIdentifier(parsed.data.identifier);
  if (!id) {
    return jsonError('VALIDATION_ERROR', 'ایمیل یا شماره موبایل نامعتبر است', {
      status: 422,
    });
  }

  // Development-only mock fallback: only reached when DATABASE_URL is absent
  // AND NODE_ENV === 'development' (or ALLOW_MOCK_AUTH=true in test environments).
  if (!isDatabaseConfigured()) {
    const existing = await findMockUser({
      email: id.email ?? undefined,
      phone: id.phone ?? undefined,
    });
    if (existing) {
      return jsonError('USER_EXISTS', 'کاربری با این ایمیل یا شماره وجود دارد', {
        status: 409,
      });
    }
    const created = await createMockUser({
      fullName: parsed.data.fullName.trim(),
      email: id.email,
      phone: id.phone,
      password: parsed.data.password,
    });
    await setSessionCookie(created.id);
    return jsonOk(
      {
        user: {
          id: created.id,
          fullName: created.fullName,
          email: created.email,
          phone: created.phone,
          role: created.role,
        },
      },
      { status: 201 },
    );
  }

  let existing: Awaited<ReturnType<typeof prisma.user.findFirst>>;
  try {
    existing = await prisma.user.findFirst({
      where: {
        OR: [
          id.email ? { email: id.email } : { id: '__none__' },
          id.phone ? { phone: id.phone } : { id: '__none__' },
        ],
      },
    });
  } catch (error) {
    logger.error('auth.register.lookup_failed', {
      code: isKnownPrismaError(error) ? error.code : 'UNKNOWN',
    });
    return databaseUnavailable();
  }

  if (existing) {
    return jsonError('USER_EXISTS', 'کاربری با این ایمیل یا شماره وجود دارد', {
      status: 409,
    });
  }

  const { hashPassword } = await import('@/lib/auth/password');
  const passwordHash = await hashPassword(parsed.data.password);

  let user: Awaited<ReturnType<typeof prisma.user.create>>;
  try {
    user = await prisma.user.create({
      data: {
        fullName: parsed.data.fullName.trim(),
        email: id.email,
        phone: id.phone,
        passwordHash,
      },
    });
  } catch (error) {
    // The pre-check above is intentionally not the source of truth because
    // concurrent requests can race. The unique DB constraint is authoritative.
    if (isKnownPrismaError(error) && error.code === 'P2002') {
      return jsonError('USER_EXISTS', 'کاربری با این ایمیل یا شماره وجود دارد', {
        status: 409,
      });
    }

    logger.error('auth.register.create_failed', {
      code: isKnownPrismaError(error) ? error.code : 'UNKNOWN',
    });
    return databaseUnavailable();
  }

  await setSessionCookie(user.id);

  return jsonOk(
    {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      },
    },
    { status: 201 },
  );
}
