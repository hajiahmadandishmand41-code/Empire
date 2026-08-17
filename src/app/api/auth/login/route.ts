import type { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonOk, jsonError, jsonPreflight } from '@/lib/api/response';
import { verifyPassword } from '@/lib/auth/password';
import { setSessionCookie } from '@/lib/auth/session';
import { loginSchema, parseIdentifier } from '@/lib/auth/schemas';
import { findMockUser } from '@/lib/auth/mock-users';
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
  const rl = await rateLimitAsync(clientKey(req, 'auth:login'), RATE_PRESETS.auth);
  if (!rl.ok) {
    logger.warn('auth.login.rate_limited', { route: '/api/auth/login' });
    return jsonError('rate_limited', 'تلاش‌های زیاد. کمی بعد دوباره امتحان کنید.', {
      status: 429,
    });
  }

  if (!isDatabaseConfigured()) {
    const env = process.env.NODE_ENV;
    if (env === 'production' || (env !== 'development' && process.env.ALLOW_MOCK_AUTH !== 'true')) {
      logger.error('auth.login.no_database', {
        message: 'A supported production database URL is not configured.',
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

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('VALIDATION_ERROR', 'ورودی نامعتبر است', {
      status: 422,
      details: { issues: parsed.error.flatten() },
    });
  }

  const id = parseIdentifier(parsed.data.identifier);
  if (!id) {
    return jsonError('INVALID_CREDENTIALS', 'ایمیل/شماره یا رمز عبور نادرست است', {
      status: 401,
    });
  }

  if (!isDatabaseConfigured()) {
    const mock = await findMockUser({ email: id.email ?? undefined, phone: id.phone ?? undefined });
    if (!mock) {
      return jsonError('INVALID_CREDENTIALS', 'ایمیل/شماره یا رمز عبور نادرست است', { status: 401 });
    }
    const ok = await verifyPassword(parsed.data.password, mock.passwordHash);
    if (!ok) {
      return jsonError('INVALID_CREDENTIALS', 'ایمیل/شماره یا رمز عبور نادرست است', { status: 401 });
    }
    if (!mock.isActive) {
      return jsonError('ACCOUNT_DISABLED', 'حساب کاربری شما غیرفعال است. با پشتیبانی تماس بگیرید.', { status: 403 });
    }
    await setSessionCookie(mock.id);
    return jsonOk({
      user: {
        id: mock.id,
        fullName: mock.fullName,
        email: mock.email,
        phone: mock.phone,
        role: mock.role,
      },
    });
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
    return jsonError('INVALID_CREDENTIALS', 'ایمیل/شماره یا رمز عبور نادرست است', { status: 401 });
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
    return jsonError('INVALID_CREDENTIALS', 'ایمیل/شماره یا رمز عبور نادرست است', { status: 401 });
  }

  const isActive = (user as unknown as { isActive?: boolean }).isActive;
  if (isActive === false) {
    return jsonError('ACCOUNT_DISABLED', 'حساب کاربری شما غیرفعال است. با پشتیبانی تماس بگیرید.', { status: 403 });
  }

  try {
    await setSessionCookie(user.id);
  } catch (error) {
    logger.error('auth.login.session_failed', { code: 'SESSION_SETUP_FAILED' }, error);
    return databaseUnavailable();
  }

  const role = (user as unknown as { role?: string }).role;

  return jsonOk({
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: role === 'admin' || role === 'seller' ? role : 'customer',
    },
  });
}
