import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
import { isDatabaseConfigured } from '@/lib/db';
import { getCategoryService } from '@/server/infrastructure/registry';

export const dynamic = 'force-dynamic';

const keySchema = z.string().trim().min(1).max(40).regex(/^[a-z0-9-_]+$/i, 'Only letters, digits, dash, underscore');
const slugSchema = z.string().trim().min(1).max(80).regex(/^[a-z0-9-_]+$/i, 'Invalid slug');
const createSchema = z.object({
  key: keySchema,
  name: z.string().trim().min(1).max(80),
  slug: slugSchema.optional(),
  parentId: z.string().trim().min(1).max(80).nullable().optional(),
  imageUrl: z.string().trim().url().max(1000).nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(100000).optional(),
});

export async function OPTIONS() { return jsonPreflight(); }

export async function GET() {
  const guard = await requireAdminApi('categories.view');
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  try {
    const items = await getCategoryService().listAll(true, false);
    return jsonOk(items, { meta: { source: 'db' } });
  } catch (err) {
    console.error('[admin/categories.GET]', err);
    return jsonError('list_failed', 'Failed to load categories', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminApi('categories.manage');
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('invalid_json', 'Invalid JSON', { status: 400 }); }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return jsonError('invalid_body', 'Invalid category payload', { status: 422, details: { issues: parsed.error.issues } });

  try {
    const created = await getCategoryService().create({
      ...parsed.data,
      slug: parsed.data.slug ?? parsed.data.key.toLowerCase(),
    });
    return jsonOk(created, { status: 201 });
  } catch (err) {
    console.error('[admin/categories.POST]', err);
    const e = err as { httpStatus?: number; code?: string; message?: string };
    return jsonError(e.code ?? 'create_failed', e.message ?? 'Failed to create category', { status: e.httpStatus ?? 500 });
  }
}