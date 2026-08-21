import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';

export const dynamic = 'force-dynamic';

const patchSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    slug: z.string().trim().min(1).max(80).optional(),
  })
  .strict();

export async function OPTIONS() {
  return jsonPreflight();
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireAdminApi('categories.manage');
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('invalid_json', 'Invalid JSON', { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('invalid_body', 'Invalid category patch', {
      status: 422,
      details: { issues: parsed.error.issues },
    });
  }
  if (!isDatabaseConfigured()) {
    return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  }
  try {
    const updated = await prisma.category.update({
      where: { id },
      data: parsed.data,
    });
    return jsonOk(updated);
  } catch (err) {
    console.error('[admin/categories.PATCH]', err);
    return jsonError('update_failed', 'Failed to update category', { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireAdminApi('categories.manage');
  if (!guard.ok) return guard.response;

  if (!isDatabaseConfigured()) {
    return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  }
  try {
    const count = await prisma.product.count({ where: { categoryId: id } });
    if (count > 0) {
      return jsonError('category_in_use', 'Category has products; move or delete them first', {
        status: 409,
        details: { productCount: count },
      });
    }
    await prisma.category.delete({ where: { id } });
    return jsonOk({ deleted: true });
  } catch (err) {
    console.error('[admin/categories.DELETE]', err);
    return jsonError('delete_failed', 'Failed to delete category', { status: 500 });
  }
}
