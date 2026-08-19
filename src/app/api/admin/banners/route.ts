import type { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
import { listAllBanners } from '@/server/services/banner.service';

export const dynamic = 'force-dynamic';

const schema = z.object({
  id: z.string().optional(),
  key: z.string().trim().min(1).max(100),
  placement: z.string().trim().min(1).max(40),
  title: z.string().max(200).nullable().optional(),
  subtitle: z.string().max(500).nullable().optional(),
  ctaLabel: z.string().max(100).nullable().optional(),
  href: z.string().max(500).nullable().optional(),
  desktopImageUrl: z.string().url(),
  mobileImageUrl: z.string().url().nullable().optional(),
  startAt: z.string().datetime().nullable().optional(),
  endAt: z.string().datetime().nullable().optional(),
  sortOrder: z.number().int().min(0).max(10000).default(0),
  autoSlide: z.boolean().default(true),
  durationMs: z.number().int().min(1500).max(30000).default(5000),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  return jsonOk(await listAllBanners());
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('invalid_json', 'Invalid JSON', { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError('invalid_body', 'Invalid banner payload', { status: 422, details: { issues: parsed.error.issues } });
  const data = parsed.data;
  try {
    const id = data.id ?? randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Banner" ("id","key","placement","title","subtitle","ctaLabel","href","desktopImageUrl","mobileImageUrl","startAt","endAt","sortOrder","autoSlide","durationMs","isActive","createdAt","updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),NOW())
       ON CONFLICT ("key") DO UPDATE SET "placement"=$3,"title"=$4,"subtitle"=$5,"ctaLabel"=$6,"href"=$7,"desktopImageUrl"=$8,"mobileImageUrl"=$9,"startAt"=$10,"endAt"=$11,"sortOrder"=$12,"autoSlide"=$13,"durationMs"=$14,"isActive"=$15,"updatedAt"=NOW()`,
      id, data.key, data.placement, data.title ?? null, data.subtitle ?? null, data.ctaLabel ?? null, data.href ?? null,
      data.desktopImageUrl, data.mobileImageUrl ?? null, data.startAt ? new Date(data.startAt) : null, data.endAt ? new Date(data.endAt) : null,
      data.sortOrder, data.autoSlide, data.durationMs, data.isActive,
    );
    return jsonOk({ id, key: data.key }, { status: 201 });
  } catch (err) {
    console.error('[admin/banners.POST]', err);
    return jsonError('save_failed', 'Failed to save banner', { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return jsonError('invalid_id', 'Banner id is required', { status: 400 });
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "Banner" WHERE "id" = $1`, id);
    return jsonOk({ deleted: true });
  } catch (err) {
    console.error('[admin/banners.DELETE]', err);
    return jsonError('delete_failed', 'Failed to delete banner', { status: 500 });
  }
}
