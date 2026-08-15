import { prisma, isDatabaseConfigured } from '@/lib/db';
import { readSessionUserId } from './session';
import { findMockUser, toCurrentUserShape } from './mock-users';

export type CurrentUserRole = 'customer' | 'seller' | 'admin';

export interface CurrentUser {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: CurrentUserRole;
  createdAt: string;
  // Auth verification flags are optional so existing callers that only care
  // about the basic identity continue to work unchanged.
  emailVerified?: boolean;
  phoneVerified?: boolean;
  isActive?: boolean;
  sellerStatus?: string;
}

/**
 * Loads the currently signed-in user (if any) from the signed session cookie.
 * The `role` field is sourced from the DB (Phase 9.3). If the underlying
 * Prisma client predates the `role` column (e.g. before running migrations),
 * we defensively fall back to `customer`.
 *
 * Phase 12 — when the database is not configured AND we are running in
 * development, looks up the user in the in-memory mock store. In production
 * or staging, a missing DATABASE_URL is a fatal misconfiguration and this
 * function returns null (the caller will surface a 503 via isDatabaseConfigured
 * checks or the session will simply be invalid).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const uid = await readSessionUserId();
  if (!uid) return null;

  // Phase 12 — mock fallback: development only.
  // In production/staging, !isDatabaseConfigured() is a misconfiguration that
  // must have been caught by the fail-fast check in the auth routes; we never
  // reach here with a live session in that case.
  if (!isDatabaseConfigured()) {
    if (process.env.NODE_ENV !== 'development' && process.env.ALLOW_MOCK_AUTH !== 'true') {
      // Database is required in non-development environments.
      // Return null so the session is treated as unauthenticated.
      return null;
    }
    const mock = await findMockUser({ id: uid });
    if (!mock) return null;
    if (!mock.isActive) return null;
    return toCurrentUserShape(mock);
  }

  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) return null;

  // Phase 11.4 — a deactivated account must not resolve to a live session.
  // Callers treat `null` as "signed out", so the guarded routes reject cleanly.
  const isActive = (user as unknown as { isActive?: boolean }).isActive;
  if (isActive != null && !isActive) return null;

  // `role` was added in Phase 9.3. Cast defensively so this file compiles
  // against older generated Prisma clients too.
  const rawRole = (user as unknown as { role?: string }).role;
  const role: CurrentUserRole = rawRole === 'admin' || rawRole === 'seller' ? rawRole : 'customer';

  // Pull verification flags defensively so auth guards can read them without
  // breaking against older generated Prisma clients.
  const emailVerified =
    (user as unknown as { emailVerified?: boolean }).emailVerified ?? false;
  const phoneVerified =
    (user as unknown as { phoneVerified?: boolean }).phoneVerified ?? false;
  const sellerStatus =
    (user as unknown as { sellerStatus?: string }).sellerStatus ?? 'none';

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
