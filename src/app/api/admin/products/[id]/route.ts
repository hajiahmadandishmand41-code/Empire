import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';

export const dynamic = 'force-dynamic';

const patchSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    shortDescription: z.string().trim().min(2).max(300).optional(),
    price: z.number().positive().optional(),
    inStock: z.boolean().optional(),
    badge: z.string().trim().max(40).nullable().optional(),
    description: z.string().optional(),
    region: z.string().trim().min(1).optional(),
  })
  .strict();

export async function OPTIONS() {
  return jsonPreflight();
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('invalid_json', 'Invalid JSON', { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('invalid_body', 'Invalid product patch', {
      status: 422,
      details: { issues: parsed.error.issues },
    });
  }
  if (!isDatabaseConfigured()) {
    return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  }
  try {
    const updated = await prisma.product.update({
      where: { id },
      data: parsed.data,
    });
    return jsonOk(updated);
  } catch (err) {
    console.error('[admin/products.PATCH]', err);
    return jsonError('update_failed', 'Failed to update product', { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  if (!isDatabaseConfigured()) {
    return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  }
  try {
    await prisma.product.delete({ where: { id } });
    return jsonOk({ deleted: true });
  } catch (err) {
    console.error('[admin/products.DELETE]', err);
    return jsonError('delete_failed', 'Failed to delete product', { status: 500 });
  }
}
