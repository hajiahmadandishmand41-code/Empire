import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
import { isDatabaseConfigured } from '@/lib/db';
import { getCategoryService } from '@/server/infrastructure/registry';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  slug: z.string().trim().min(1).max(80).regex(/^[a-z0-9-_]+$/i).optional(),
  parentId: z.string().trim().min(1).max(80).nullable().optional(),
  imageUrl: z.string().trim().url().max(1000).nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(100000).optional(),
}).strict();

export async function OPTIONS() { return jsonPreflight(); }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('invalid_json', 'Invalid JSON', { status: 400 }); }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError('invalid_body', 'Invalid category patch', { status: 422, details: { issues: parsed.error.issues } });

  try {
    const updated = await getCategoryService().update(id, parsed.data);
    return jsonOk(updated);
  } catch (err) {
    console.error('[admin/categories.PATCH]', err);
    const e = err as { httpStatus?: number; code?: string; message?: string };
    return jsonError(e.code ?? 'update_failed', e.message ?? 'Failed to update category', { status: e.httpStatus ?? 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  try {
    const service = getCategoryService();
    const category = await service.listAll(true, false);
    const existing = category.find((item) => item.id === id);
    if (!existing) return jsonError('not_found', 'Category not found', { status: 404 });
    if ((existing.productCount ?? 0) > 0) {
      return jsonError('category_in_use', 'Category has products; move them first', { status: 409, details: { productCount: existing.productCount } });
    }
    await service.delete(id);
    return jsonOk({ deleted: true });
  } catch (err) {
    console.error('[admin/categories.DELETE]', err);
    const e = err as { httpStatus?: number; code?: string; message?: string };
    return jsonError(e.code ?? 'delete_failed', e.message ?? 'Failed to delete category', { status: e.httpStatus ?? 500 });
  }
}
