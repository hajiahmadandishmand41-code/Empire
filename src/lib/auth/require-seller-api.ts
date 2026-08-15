/**
 * Seller API guard.
 * Seller privileges require an authenticated, active account whose seller
 * application is approved. Admins retain access to seller operations.
 */
import { getCurrentUser, type CurrentUser } from './current-user';
import { jsonError } from '@/lib/api/response';
import type { NextResponse } from 'next/server';

export type SellerGuardResult =
  | { ok: true; user: CurrentUser }
  | { ok: false; response: NextResponse };

export function isApprovedActiveSeller(user: Pick<CurrentUser, 'role' | 'sellerStatus' | 'isActive'>): boolean {
  return user.role === 'seller' && user.sellerStatus === 'approved' && user.isActive !== false;
}

export async function requireSellerApi(): Promise<SellerGuardResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      response: jsonError('unauthorized', 'Authentication required', { status: 401 }),
    };
  }
  if (user.role === 'admin') return { ok: true, user };
  if (!isApprovedActiveSeller(user)) {
    return {
      ok: false,
      response: jsonError('forbidden', 'Approved seller access required', { status: 403 }),
    };
  }
  return { ok: true, user };
}
