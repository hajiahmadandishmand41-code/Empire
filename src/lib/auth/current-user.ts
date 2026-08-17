import { prisma, isDatabaseConfigured } from '@/lib/db';
import { getSessionPayload } from './session';

export type CurrentUserRole = 'customer' | 'seller' | 'admin';

export interface CurrentUser {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: CurrentUserRole;
  createdAt: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  isActive?: boolean;
  sellerStatus?: string;
}

/**
 * Loads the authenticated database user and invalidates sessions issued
 * before the last account mutation. Authentication never falls back to an
 * in-memory or demo user store.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSessionPayload();
  if (!session || !isDatabaseConfigured()) return null;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !user.isActive) return null;

  if (user.updatedAt.getTime() > session.issuedAtMs) return null;

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    isActive: user.isActive,
    sellerStatus: user.sellerStatus,
  };
}
