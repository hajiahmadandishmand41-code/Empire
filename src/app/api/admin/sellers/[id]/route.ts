import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';

export const dynamic = 'force-dynamic';

const patchSchema = z
  .object({
    action: z.enum(['approve', 'reject', 'reset']).optional(),
    sellerStatus: z.enum(['none', 'pending', 'approved', 'rejected']).optional(),
    isActive: z.boolean().optional(),
    shopName: z.string().max(120).optional(),
    bio: z.string().max(2000).optional(),
  })
  .strict()
  .refine(
    (v) =>
      v.action !== undefined ||
      v.sellerStatus !== undefined ||
      v.isActive !== undefined ||
      v.shopName !== undefined ||
      v.bio !== undefined,
    { message: 'Provide at least one field' },
  );

export async function OPTIONS() {
  return jsonPreflight();
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  if (guard.user.id === id) {
    return jsonError('self_modification_forbidden', 'You cannot modify yourself here', {
      status: 409,
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('invalid_json', 'Invalid JSON', { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('invalid_body', 'Invalid seller patch', {
      status: 422,
      details: { issues: parsed.error.issues },
    });
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.action === 'approve') {
    data.sellerStatus = 'approved';
    data.role = 'seller';
  } else if (parsed.data.action === 'reject') {
    data.sellerStatus = 'rejected';
  } else if (parsed.data.action === 'reset') {
    data.sellerStatus = 'none';
  }
  if (parsed.data.sellerStatus) data.sellerStatus = parsed.data.sellerStatus;
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;
  if (parsed.data.shopName !== undefined) data.sellerShopName = parsed.data.shopName;
  if (parsed.data.bio !== undefined) data.sellerBio = parsed.data.bio;

  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  try {
    const updated = await prisma.user.update({
      where: { id },
      data: data as never,
    });
    const raw = updated as unknown as { sellerStatus?: string; role?: string; isActive?: boolean };
    return jsonOk({
      id: updated.id,
      sellerStatus: raw.sellerStatus,
      role: raw.role,
      isActive: raw.isActive,
    });
  } catch (err) {
    console.error('[admin/sellers.PATCH]', err);
    return jsonError('update_failed', 'Failed to update seller', { status: 500 });
  }
}
