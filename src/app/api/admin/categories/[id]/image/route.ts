import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';

const schema = z.object({ url: z.string().url().nullable() });
export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminApi('categories.manage');
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError('invalid_body', 'Invalid category image payload', { status: 422 });
  const { id } = await params;
  try {
    const result = await prisma.$queryRaw<Array<{ id: string; imageUrl: string | null }>>`UPDATE "Category" SET "imageUrl" = ${parsed.data.url} WHERE "id" = ${id} RETURNING "id", "imageUrl"`;
    if (!result[0]) return jsonError('not_found', 'Category not found', { status: 404 });
    return jsonOk(result[0]);
  } catch {
    return jsonError('save_failed', 'Failed to save category image', { status: 500 });
  }
}
