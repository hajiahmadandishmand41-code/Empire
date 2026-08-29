import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
import { recordAudit } from '@/lib/audit/log';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  action: z.enum(['approve', 'reject', 'reset']).optional(),
  sellerStatus: z.enum(['none', 'pending', 'approved', 'rejected']).optional(),
  isActive: z.boolean().optional(),
  shopName: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(2000).optional(),
}).strict().refine((v) => v.action !== undefined || v.sellerStatus !== undefined || v.isActive !== undefined || v.shopName !== undefined || v.bio !== undefined, { message: 'Provide at least one field' });

export async function OPTIONS() { return jsonPreflight(); }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireAdminApi('sellers.manage');
  if (!guard.ok) return guard.response;
  if (guard.user.id === id) return jsonError('self_modification_forbidden', 'You cannot modify yourself here', { status: 409 });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('invalid_json', 'Invalid JSON', { status: 400 }); }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError('invalid_body', 'Invalid seller patch', { status: 422, details: { issues: parsed.error.issues } });

  try {
    const previous = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true, sellerStatus: true, isActive: true, sellerShopName: true, sellerBio: true } });
    if (!previous) return jsonError('not_found', 'Seller not found', { status: 404 });
    if (previous.role !== 'seller' && previous.sellerStatus === 'none' && parsed.data.action !== 'approve' && parsed.data.sellerStatus !== 'pending') {
      return jsonError('not_seller', 'This user has no seller application or seller status', { status: 409 });
    }

    const requestedStatus = parsed.data.sellerStatus ?? (parsed.data.action === 'approve' ? 'approved' : parsed.data.action === 'reject' ? 'rejected' : parsed.data.action === 'reset' ? 'none' : undefined);
    if (requestedStatus !== undefined) {
      const allowed: Record<string, string[]> = { none: ['pending', 'approved'], pending: ['approved', 'rejected', 'none'], approved: ['rejected', 'none', 'approved'], rejected: ['none', 'approved', 'rejected'] };
      if (!allowed[previous.sellerStatus]?.includes(requestedStatus)) return jsonError('invalid_transition', 'تغییر وضعیت فروشنده مجاز نیست.', { status: 409 });
    }

    const data: { sellerStatus?: 'none' | 'pending' | 'approved' | 'rejected'; role?: 'customer' | 'seller'; isActive?: boolean; sellerShopName?: string; sellerBio?: string } = {};
    if (requestedStatus !== undefined) { data.sellerStatus = requestedStatus; data.role = requestedStatus === 'approved' ? 'seller' : 'customer'; }
    if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;
    if (parsed.data.shopName !== undefined) data.sellerShopName = parsed.data.shopName;
    if (parsed.data.bio !== undefined) data.sellerBio = parsed.data.bio;

    const updated = await prisma.user.update({ where: { id }, data, select: { id: true, role: true, sellerStatus: true, isActive: true, sellerShopName: true, sellerBio: true } });
    await recordAudit({ actor: { id: guard.user.id, role: guard.user.role }, action: 'seller.update', entityType: 'seller', entityId: id, before: previous, after: updated, req });
    return jsonOk({ seller: { id: updated.id, sellerStatus: updated.sellerStatus, role: updated.role, isActive: updated.isActive, shop: updated.sellerShopName ? { name: updated.sellerShopName, bio: updated.sellerBio } : null } });
  } catch (err) {
    console.error('[admin/sellers.PATCH]', err);
    return jsonError('update_failed', 'به‌روزرسانی فروشنده با خطا مواجه شد.', { status: 500 });
  }
}
