/**
 * Role helpers — Phase 9.3.
 *
 * Small server-side helpers for reading the current user's role and
 * guarding Server Components / API routes. All helpers are safe to call
 * from Server Components, Route Handlers, and Server Actions.
 *
 * `require*` helpers throw a Next.js `redirect` when the user is missing
 * or lacks the required role. Caller code after them can safely treat
 * the returned value as non-null.
 */
import { redirect } from '@/i18n/routing';
import { getCurrentUser, type CurrentUser, type CurrentUserRole } from './current-user';

export type Role = CurrentUserRole;

export async function isAuthenticated(): Promise<boolean> {
  const u = await getCurrentUser();
  return u !== null;
}

export async function isAdmin(): Promise<boolean> {
  const u = await getCurrentUser();
  return u?.role === 'admin';
}

export async function isSeller(): Promise<boolean> {
  const u = await getCurrentUser();
  return u?.role === 'seller';
}

export async function isCustomer(): Promise<boolean> {
  const u = await getCurrentUser();
  return u?.role === 'customer';
}

interface RequireOpts {
  locale: string;
}

/** Requires a signed-in user; redirects to the canonical auth route otherwise. */
export async function requireAuth(opts: RequireOpts): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: '/auth/login', locale: opts.locale });
  }
  return user!;
}

/** Requires an admin user. Redirects to auth (guest) or /403 (wrong role). */
export async function requireAdmin(opts: RequireOpts): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: '/auth/login', locale: opts.locale });
  }
  if (user!.role !== 'admin') {
    redirect({ href: '/403', locale: opts.locale });
  }
  return user!;
}

/** Requires a seller user. Redirects to auth (guest) or /403 (wrong role). */
export async function requireSeller(opts: RequireOpts): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: '/auth/login', locale: opts.locale });
  }
  if (user!.role !== 'seller' && user!.role !== 'admin') {
    redirect({ href: '/403', locale: opts.locale });
  }
  return user!;
}
