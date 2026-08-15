/**
 * Address item API — Phase 3
 * PUT    /api/addresses/[id]  → update (owner only)
 * DELETE /api/addresses/[id]  → delete   (owner only)
 */
import type { NextRequest } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { addressInputSchema } from '@/lib/validation/order';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { getCurrentUser } from '@/lib/auth/current-user';
import { mapAddress } from '@/lib/db-mappers';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return jsonPreflight();
}

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return jsonError('unauthorized', 'Authentication required', { status: 401 });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'DB not configured', { status: 503 });

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('invalid_json', 'Bad JSON', { status: 400 }); }
  const parsed = addressInputSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('invalid_body', 'Invalid address', { status: 422, details: { issues: parsed.error.issues } });
  }
  const data = parsed.data;

  const owned = await prisma.address.findFirst({ where: { id, userId: user.id } });
  if (!owned) return jsonError('not_found', 'Address not found', { status: 404 });

  const updated = await prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({
        where: { userId: user.id, NOT: { id } },
        data: { isDefault: false },
      });
    }
    return tx.address.update({
      where: { id },
      data: { ...data, isDefault: !!data.isDefault },
    });
  });
  return jsonOk(mapAddress(updated));
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return jsonError('unauthorized', 'Authentication required', { status: 401 });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'DB not configured', { status: 503 });

  const owned = await prisma.address.findFirst({ where: { id, userId: user.id } });
  if (!owned) return jsonError('not_found', 'Address not found', { status: 404 });

  // If it's referenced by orders, we soft-detach the user link instead of hard delete.
  const orderCount = await prisma.order.count({ where: { addressId: id } });
  if (orderCount > 0) {
    await prisma.address.update({ where: { id }, data: { userId: null, isDefault: false } });
  } else {
    await prisma.address.delete({ where: { id } });
  }
  return jsonOk({ id, deleted: true });
}
