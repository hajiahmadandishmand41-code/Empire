/** Admin API guard with backend RBAC. */
import { getCurrentUser, type CurrentUser } from './current-user';
import { jsonError } from '@/lib/api/response';
import type { NextResponse } from 'next/server';
import { getAdminAccessRole, DEFAULT_PERMISSIONS, type AdminAccessRole } from '@/features/admin/lib/control-store';

export type AdminPermission =
  | 'dashboard.view' | 'products.view' | 'products.manage' | 'categories.view' | 'categories.manage'
  | 'orders.view' | 'orders.manage' | 'sellers.view' | 'sellers.manage' | 'users.view' | 'users.manage'
  | 'banners.manage' | 'homepage.manage' | 'recommendations.manage' | 'reviews.manage' | 'media.manage'
  | 'analytics.view' | 'search.view' | 'notifications.manage' | 'audit.view'
  | 'payouts.view' | 'payouts.manage' | 'shipping.view' | 'shipping.manage';

export type AdminGuardResult =
  { ok: true; user: CurrentUser; accessRole: AdminAccessRole; permissions: string[] }
  | { ok: false; response: NextResponse };

export async function requireAdminApi(permission?: AdminPermission): Promise<AdminGuardResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, response: jsonError('unauthorized', 'Authentication required', { status: 401 }) };
  if (user.role !== 'admin') return { ok: false, response: jsonError('forbidden', 'Admin access required', { status: 403 }) };

  try {
    const access = await getAdminAccessRole(user.id);
    const accessRole = access.role;
    const permissions = access.permissions;
    if (permission && !permissions.includes('*') && !permissions.includes(permission)) {
      return { ok: false, response: jsonError('forbidden', 'You do not have permission for this operation', { status: 403 }) };
    }
    return { ok: true, user, accessRole, permissions };
  } catch {
    if (permission) {
      return { ok: false, response: jsonError('rbac_unavailable', 'Admin permissions are temporarily unavailable', { status: 503 }) };
    }
    return { ok: true, user, accessRole: 'admin', permissions: DEFAULT_PERMISSIONS.admin };
  }
}
