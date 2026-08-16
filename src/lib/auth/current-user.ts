import { prisma, isDatabaseConfigured } from '@/lib/db';
import { getSessionPayload } from './session';
import { findMockUser, toCurrentUserShape } from './mock-users';

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
 * Loads the currently signed-in user and rejects sessions issued before the
 * user's last account mutation. The session keeps an exact millisecond
 * issuance timestamp so Prisma's sub-second timestamps cannot invalidate a
 * brand-new login immediately after registration or OAuth linking.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSessionPayload();
  if (!session) return null;

  if (!isDatabaseConfigured()) {
    if (process.env.NODE_ENV !== 'development' && process.env.ALLOW_MOCK_AUTH !== 'true') {
      return null;
    }
    const mock = await findMockUser({ id: session.userId });
    if (!mock || !mock.isActive) return null;
    return toCurrentUserShape(mock);
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return null;

  const isActive = (user as unknown as { isActive?: boolean }).isActive;
  if (isActive != null && !isActive) return null;

  // updatedAt is changed by Prisma on account mutations. A token issued
  // before that timestamp is stale and must not authorize the request.
  if (user.updatedAt.getTime() > session.issuedAtMs) return null;

  const rawRole = (user as unknown as { role?: string }).role;
  const role: CurrentUserRole = rawRole === 'admin' || rawRole === 'seller' ? rawRole : 'customer';
  const emailVerified = (user as unknown as { emailVerified?: boolean }).emailVerified ?? false;
  const phoneVerified = (user as unknown as { phoneVerified?: boolean }).phoneVerified ?? false;
  const sellerStatus = (user as unknown as { sellerStatus?: string }).sellerStatus ?? 'none';

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role,
    createdAt: user.createdAt.toISOString(),
    emailVerified,
    phoneVerified,
    isActive: isActive ?? true,
    sellerStatus,
  };
}
