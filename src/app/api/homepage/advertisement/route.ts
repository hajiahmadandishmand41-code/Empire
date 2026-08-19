import type { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';

export const dynamic = 'force-dynamic';

const baseSchema = z.object({
  titleFa: z.string().trim().min(1).max(120),
  titlePs: z.string().trim().min(1).max(120),
  titleEn: z.string().trim().min(1).max(120),
  subtitleFa: z.string().trim().max(240).optional().nullable(),
  subtitlePs: z.string().trim().max(240).optional().nullable(),
  subtitleEn: z.string().trim().max(240).optional().nullable(),
  imageUrl: z.string().trim().url().max(1000).optional().nullable(),
  href: z.string().trim().max(500).optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(999),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
});

function mapRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    titleFa: String(row.titleFa ?? ''),
    titlePs: String(row.titlePs ?? ''),
    titleEn: String(row.titleEn ?? ''),
    subtitleFa: row.subtitleFa ? String(row.subtitleFa) : '',
    subtitlePs: row.subtitlePs ? String(row.subtitlePs) : '',
    subtitleEn: row.subtitleEn ? String(row.subtitleEn) : '',
    imageUrl: row.imageUrl ? String(row.imageUrl) : '',
    href: row.href ? String(row.href) : '/shop',
    isActive: Boolean(row.isActive),
    sortOrder: Number(row.sortOrder ?? 0),
    startsAt: row.startsAt ? new Date(String(row.startsAt)).toISOString() : null,
    endsAt: row.endsAt ? new Date(String(row.endsAt)).toISOString() : null,
  };
}

export async function GET() {
  if (!isDatabaseConfigured()) return jsonOk(null);
  try {
    const rows = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT * FROM "HomepageAdvertisement"
      WHERE "isActive" = true
        AND ("startsAt" IS NULL OR "startsAt" <= NOW())
        AND ("endsAt" IS NULL OR "endsAt" >= NOW())
      ORDER BY "sortOrder" ASC, "createdAt" DESC
      LIMIT 1
    `);
    return jsonOk(rows[0] ? mapRow(rows[0]) : null);
  } catch (error) {
    console.error('[homepage-advertisement.GET]', error);
    return jsonOk(null);
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  try {
    const body = await req.json();
    const parsed = baseSchema.safeParse(body);
    if (!parsed.success) return jsonError('invalid_body', 'Invalid advertisement payload', { status: 422, details: { issues: parsed.error.issues } });

    const id = `ad-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const d = parsed.data;
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO "HomepageAdvertisement" ("id","titleFa","titlePs","titleEn","subtitleFa","subtitlePs","subtitleEn","imageUrl","href","isActive","sortOrder","startsAt","endsAt","createdAt","updatedAt")
      VALUES (${id},${d.titleFa},${d.titlePs},${d.titleEn},${d.subtitleFa ?? null},${d.subtitlePs ?? null},${d.subtitleEn ?? null},${d.imageUrl ?? null},${d.href ?? '/shop'},${d.isActive},${d.sortOrder},${d.startsAt ? new Date(d.startsAt) : null},${d.endsAt ? new Date(d.endsAt) : null},NOW(),NOW())
    `);
    return jsonOk({ id }, { status: 201 });
  } catch (error) {
    console.error('[homepage-advertisement.POST]', error);
    return jsonError('create_failed', 'Failed to create advertisement', { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  try {
    const body = await req.json() as { id?: string } & Record<string, unknown>;
    const id = typeof body.id === 'string' ? body.id : '';
    if (!id) return jsonError('invalid_id', 'Advertisement id is required', { status: 400 });
    const parsed = baseSchema.safeParse(body);
    if (!parsed.success) return jsonError('invalid_body', 'Invalid advertisement payload', { status: 422, details: { issues: parsed.error.issues } });
    const d = parsed.data;
    const result = await prisma.$executeRaw(Prisma.sql`
      UPDATE "HomepageAdvertisement"
      SET "titleFa"=${d.titleFa},"titlePs"=${d.titlePs},"titleEn"=${d.titleEn},
          "subtitleFa"=${d.subtitleFa ?? null},"subtitlePs"=${d.subtitlePs ?? null},"subtitleEn"=${d.subtitleEn ?? null},
          "imageUrl"=${d.imageUrl ?? null},"href"=${d.href ?? '/shop'},"isActive"=${d.isActive},"sortOrder"=${d.sortOrder},
          "startsAt"=${d.startsAt ? new Date(d.startsAt) : null},"endsAt"=${d.endsAt ? new Date(d.endsAt) : null},"updatedAt"=NOW()
      WHERE "id"=${id}
    `);
    if (!result) return jsonError('not_found', 'Advertisement not found', { status: 404 });
    return jsonOk({ id });
  } catch (error) {
    console.error('[homepage-advertisement.PUT]', error);
    return jsonError('update_failed', 'Failed to update advertisement', { status: 500 });
  }
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
  } catch (error) {
    console.error('[homepage-advertisement.DELETE]', error);
    return jsonError('delete_failed', 'Failed to delete advertisement', { status: 500 });
  }
}
