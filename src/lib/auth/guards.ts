import { NextResponse } from 'next/server';
import { getSessionPayload } from './session';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import type { CurrentUser, CurrentUserRole } from './current-user';

type GuardResult =
  | { user: CurrentUser; response: null }
  | { user: null; response: NextResponse };

function mockAuthEnabled(): boolean {
  return process.env.NODE_ENV === 'development' && process.env.ALLOW_MOCK_AUTH === 'true';
}

async function loadUser(userId: string): Promise<CurrentUser | null> {
  if (!isDatabaseConfigured()) {
    if (!mockAuthEnabled()) return null;
    return {
      id: userId,
      email: null,
      phone: null,
      fullName: 'Mock User',
      role: 'customer' as CurrentUserRole,
      createdAt: new Date().toISOString(),
      isActive: true,
      sellerStatus: 'none',
      emailVerified: false,
      phoneVerified: false,
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        isActive: true,
        sellerStatus: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
      },
    });
    if (!user || !user.isActive) return null;
    return {
      ...user,
      role: user.role as CurrentUserRole,
      createdAt: user.createdAt.toISOString(),
    };
  } catch {
    return null;
  }
}

export async function requireUserApi(): Promise<GuardResult> {
  const session = await getSessionPayload();
  if (!session) {
    return {
      user: null,
      response: NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      ),
    };
  }
  const user = await loadUser(session.userId);
  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'User not found or inactive' } },
        { status: 401 },
      ),
    };
  }
  return { user, response: null };
}

export async function requireAdminApi(): Promise<GuardResult> {
  const result = await requireUserApi();
  if (result.response) return result;
  if (result.user.role !== 'admin') {
    return {
      user: null,
      response: NextResponse.json(
        { ok: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 },
      ),
    };
  }
  return result;
}

export async function requireSellerApi(): Promise<GuardResult> {
  const result = await requireUserApi();
  if (result.response) return result;
  if (result.user.role !== 'seller' && result.user.role !== 'admin') {
    return {
      user: null,
      response: NextResponse.json(
        { ok: false, error: { code: 'FORBIDDEN', message: 'Seller access required' } },
        { status: 403 },
      ),
    };
  }
  return result;
}
