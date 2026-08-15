/**
 * Seller API guard — Phase 11.2.
 *
 * Mirrors `requireAdminApi` but authorises both `seller` and `admin`
 * roles. Returns either the current user or a JSON `NextResponse`
 * (401/403) that the caller should return immediately.
 */
import { getCurrentUser, type CurrentUser } from './current-user';
import { jsonError } from '@/lib/api/response';
import type { NextResponse } from 'next/server';

export type SellerGuardResult =
  | { ok: true; user: CurrentUser }
  | { ok: false; response: NextResponse };

export async function requireSellerApi(): Promise<SellerGuardResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      response: jsonError('unauthorized', 'Authentication required', { status: 401 }),
    };
  }
  if (user.role !== 'seller' && user.role !== 'admin') {
    return {
      ok: false,
      response: jsonError('forbidden', 'Seller access required', { status: 403 }),
    };
  }
  return { ok: true, user };
}
