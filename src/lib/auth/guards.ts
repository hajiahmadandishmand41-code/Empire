import { NextResponse } from 'next/server';
import { getSessionPayload } from './session';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import type { CurrentUser, CurrentUserRole } from './current-user';

type GuardResult =
  | { user: CurrentUser; response: null }
  | { user: null; response: NextResponse };

async function loadUser(userId: string): Promise<CurrentUser | null> {
  if (!isDatabaseConfigured()) return null;

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
        updatedAt: true,
      },
    });
    if (!user || !user.isActive) return null;

    const session = await getSessionPayload();
    if (!session || user.updatedAt.getTime() > session.issuedAtMs) return null;

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.fullName,
      role: user.role as CurrentUserRole,
      createdAt: user.createdAt.toISOString(),
      isActive: user.isActive,
      sellerStatus: user.sellerStatus,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
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
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'User not found, inactive, or session expired' } },
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
