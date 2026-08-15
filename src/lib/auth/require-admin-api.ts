/**
 * Admin API guard — Phase 10.
 *
 * Server-side helper for API Route Handlers that require an admin user.
 * Returns either the current user (authorized) or a JSON `NextResponse`
 * (401 / 403) that the caller should return immediately.
 */
import { getCurrentUser, type CurrentUser } from './current-user';
import { jsonError } from '@/lib/api/response';
import type { NextResponse } from 'next/server';

export type AdminGuardResult =
  { ok: true; user: CurrentUser } | { ok: false; response: NextResponse };

export async function requireAdminApi(): Promise<AdminGuardResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      response: jsonError('unauthorized', 'Authentication required', {
        status: 401,
      }),
    };
  }
  if (user.role !== 'admin') {
    return {
      ok: false,
      response: jsonError('forbidden', 'Admin access required', {
        status: 403,
      }),
    };
  }
  return { ok: true, user };
}
