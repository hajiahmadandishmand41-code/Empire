import type { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';

export const dynamic = 'force-dynamic';

const schema = z.object({
  id: z.string().optional(),
  titleFa: z.string().trim().min(1).max(120),
  titlePs: z.string().trim().min(1).max(120),
  titleEn: z.string().trim().min(1).max(120),
  subtitleFa: z.string().trim().max(240), subtitlePs: z.string().trim().max(240), subtitleEn: z.string().trim().max(240),
  imageUrl: z.string().trim().url().max(1000), href: z.string().trim().max(500),
  isActive: z.boolean(), sortOrder: z.coerce.number().int().min(0).max(999),
});

function mapRow(row: Record<string, unknown>) {
  return {
    id: String(row.id), titleFa: String(row.titleFa ?? ''), titlePs: String(row.titlePs ?? ''), titleEn: String(row.titleEn ?? ''),
    subtitleFa: String(row.subtitleFa ?? ''), subtitlePs: String(row.subtitlePs ?? ''), subtitleEn: String(row.subtitleEn ?? ''),
    imageUrl: String(row.imageUrl ?? ''), href: String(row.href ?? '/shop'), isActive: Boolean(row.isActive), sortOrder: Number(row.sortOrder ?? 0),
    startsAt: row.startsAt ? new Date(String(row.startsAt)).toISOString() : null, endsAt: row.endsAt ? new Date(String(row.endsAt)).toISOString() : null,
  };
}

async function listAll() {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`SELECT * FROM "HomepageAdvertisement" ORDER BY "sortOrder" ASC, "createdAt" DESC`);
  return rows.map(mapRow);
}

export async function GET() {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonOk([]);
  try { return jsonOk(await listAll()); } catch (error) { console.error('[admin/homepage-advertisements.GET]', error); return jsonError('query_failed', 'Failed to load advertisements', { status: 500 }); }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  try {
    const parsed = schema.omit({ id: true }).safeParse(await req.json());
    if (!parsed.success) return jsonError('invalid_body', 'Invalid advertisement payload', { status: 422 });
    const d = parsed.data;
    const id = `ad-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await prisma.$executeRaw(Prisma.sql`INSERT INTO "HomepageAdvertisement" ("id","titleFa","titlePs","titleEn","subtitleFa","subtitlePs","subtitleEn","imageUrl","href","isActive","sortOrder","createdAt","updatedAt") VALUES (${id},${d.titleFa},${d.titlePs},${d.titleEn},${d.subtitleFa},${d.subtitlePs},${d.subtitleEn},${d.imageUrl},${d.href},${d.isActive},${d.sortOrder},NOW(),NOW())`);
    return jsonOk({ id }, { status: 201 });
  } catch (error) { console.error('[admin/homepage-advertisements.POST]', error); return jsonError('create_failed', 'Failed to create advertisement', { status: 500 }); }
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success || !parsed.data.id) return jsonError('invalid_body', 'Invalid advertisement payload', { status: 422 });
    const d = parsed.data;
    const result = await prisma.$executeRaw(Prisma.sql`UPDATE "HomepageAdvertisement" SET "titleFa"=${d.titleFa},"titlePs"=${d.titlePs},"titleEn"=${d.titleEn},"subtitleFa"=${d.subtitleFa},"subtitlePs"=${d.subtitlePs},"subtitleEn"=${d.subtitleEn},"imageUrl"=${d.imageUrl},"href"=${d.href},"isActive"=${d.isActive},"sortOrder"=${d.sortOrder},"updatedAt"=NOW() WHERE "id"=${d.id}`);
    if (!result) return jsonError('not_found', 'Advertisement not found', { status: 404 });
    return jsonOk({ id: d.id });
  } catch (error) { console.error('[admin/homepage-advertisements.PUT]', error); return jsonError('update_failed', 'Failed to update advertisement', { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return jsonError('invalid_id', 'Advertisement id is required', { status: 400 });
    await prisma.$executeRaw(Prisma.sql`DELETE FROM "HomepageAdvertisement" WHERE "id"=${id}`);
    return jsonOk({ id });
  } catch (error) { console.error('[admin/homepage-advertisements.DELETE]', error); return jsonError('delete_failed', 'Failed to delete advertisement', { status: 500 }); }
}
