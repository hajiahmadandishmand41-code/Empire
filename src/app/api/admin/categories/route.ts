import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
import { listAdminCategories } from '@/features/admin/lib/queries';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  key: z.string().trim().min(1).max(40).regex(/^[a-z0-9-_]+$/i, 'Only letters, digits, dash, underscore'),
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().min(1).max(80).optional(),
});

export async function OPTIONS() { return jsonPreflight(); }

export async function GET() {
  const guard = await requireAdminApi('categories.view');
  if (!guard.ok) return guard.response;
  const { items, source } = await listAdminCategories();
  if (!isDatabaseConfigured()) return jsonOk(items, { meta: { source } });
  try {
    const media = await prisma.$queryRaw<Array<{ id: string; imageUrl: string | null }>>`SELECT "id", "imageUrl" FROM "Category"`;
    const byId = new Map(media.map((row) => [row.id, row.imageUrl]));
    return jsonOk(items.map((item) => ({ ...item, imageUrl: byId.get(item.id) ?? null })), { meta: { source } });
  } catch {
    return jsonOk(items.map((item) => ({ ...item, imageUrl: null })), { meta: { source, media: 'unavailable' } });
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminApi('categories.manage');
  if (!guard.ok) return guard.response;
  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('invalid_json', 'Invalid JSON', { status: 400 }); }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return jsonError('invalid_body', 'Invalid category payload', { status: 422, details: { issues: parsed.error.issues } });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  try {
    const slug = parsed.data.slug ?? parsed.data.key.toLowerCase();
    const created = await prisma.category.create({ data: { key: parsed.data.key, name: parsed.data.name, slug } });
    return jsonOk(created, { status: 201 });
  } catch (err) { console.error('[admin/categories.POST]', err); return jsonError('create_failed', 'Failed to create category', { status: 500 }); }
}
