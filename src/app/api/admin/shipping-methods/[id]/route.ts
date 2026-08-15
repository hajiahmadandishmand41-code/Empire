/**
 * Admin shipping method item — Phase 3
 * PUT    /api/admin/shipping-methods/[id]
 * DELETE /api/admin/shipping-methods/[id]
 */
import type { NextRequest } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { shippingMethodInputSchema } from '@/lib/validation/order';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
import { mapShippingMethod } from '@/lib/db-mappers';

export const dynamic = 'force-dynamic';
export async function OPTIONS() { return jsonPreflight(); }

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'DB not configured', { status: 503 });

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('invalid_json', 'Bad JSON', { status: 400 }); }
  const parsed = shippingMethodInputSchema.partial().safeParse(body);
  if (!parsed.success) {
    return jsonError('invalid_body', 'Invalid data', { status: 422, details: { issues: parsed.error.issues } });
  }

  const existing = await prisma.shippingMethod.findUnique({ where: { id } });
  if (!existing) return jsonError('not_found', 'Not found', { status: 404 });

  const updated = await prisma.shippingMethod.update({ where: { id }, data: parsed.data });
  return jsonOk(mapShippingMethod(updated));
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'DB not configured', { status: 503 });

  const existing = await prisma.shippingMethod.findUnique({ where: { id } });
  if (!existing) return jsonError('not_found', 'Not found', { status: 404 });

  // If any orders reference this method, soft-deactivate rather than break FK.
  const inUse = await prisma.order.count({ where: { shippingMethodId: id } });
  if (inUse > 0) {
    const updated = await prisma.shippingMethod.update({
      where: { id },
      data: { isActive: false },
    });
    return jsonOk({ ...mapShippingMethod(updated), softDeleted: true });
  }
  await prisma.shippingMethod.delete({ where: { id } });
  return jsonOk({ id, deleted: true });
}
