import type { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
import { listAllBanners } from '@/server/services/banner.service';
import { adminMediaUrlSchema } from '@/features/admin/lib/media-url';

export const dynamic = 'force-dynamic';

const placementSchema = z.enum(['HOME_HERO', 'HOME_PROMO_1', 'HOME_PROMO_2', 'HOME_MID', 'HOME_CATEGORY', 'HOME_SELLER']);
const schema = z.object({
  id: z.string().optional(), key: z.string().trim().min(1).max(100), placement: placementSchema,
  title: z.string().max(200).nullable().optional(), subtitle: z.string().max(500).nullable().optional(), ctaLabel: z.string().max(100).nullable().optional(),
  href: z.string().max(500).nullable().optional(), desktopImageUrl: adminMediaUrlSchema, mobileImageUrl: adminMediaUrlSchema.nullable().optional(),
  startAt: z.string().datetime().nullable().optional(), endAt: z.string().datetime().nullable().optional(), sortOrder: z.number().int().min(0).max(10000).default(0),
  autoSlide: z.boolean().default(true), durationMs: z.number().int().min(1500).max(30000).default(5000), isActive: z.boolean().default(true),
}).superRefine((value, ctx) => { if (value.startAt && value.endAt && new Date(value.endAt) <= new Date(value.startAt)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endAt'], message: 'End time must be after start time' }); });

export async function GET() {
  const g = await requireAdminApi('banners.manage'); if (!g.ok) return g.response;
  try { return jsonOk(await listAllBanners()); } catch { return jsonError('query_failed', 'Failed to load banners', { status: 500 }); }
}

export async function POST(req: NextRequest) {
  const g = await requireAdminApi('banners.manage'); if (!g.ok) return g.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError('invalid_body', 'Invalid banner payload', { status: 422, details: { issues: parsed.error.issues } });
  try {
    const d = parsed.data;
    if (d.id) {
      const existing = await prisma.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "Banner" WHERE "id" = ${d.id} LIMIT 1`;
      if (!existing[0]) return jsonError('not_found', 'Banner not found', { status: 404 });
      await prisma.$executeRaw`UPDATE "Banner" SET "key"=${d.key},"placement"=${d.placement},"title"=${d.title ?? null},"subtitle"=${d.subtitle ?? null},"ctaLabel"=${d.ctaLabel ?? null},"href"=${d.href ?? null},"desktopImageUrl"=${d.desktopImageUrl},"mobileImageUrl"=${d.mobileImageUrl ?? null},"startAt"=${d.startAt ? new Date(d.startAt) : null},"endAt"=${d.endAt ? new Date(d.endAt) : null},"sortOrder"=${d.sortOrder},"autoSlide"=${d.autoSlide},"durationMs"=${d.durationMs},"isActive"=${d.isActive},"updatedAt"=NOW() WHERE "id"=${d.id}`;
      return jsonOk({ id: d.id, key: d.key });
    }
    const id = randomUUID();
    await prisma.$executeRaw`INSERT INTO "Banner" ("id","key","placement","title","subtitle","ctaLabel","href","desktopImageUrl","mobileImageUrl","startAt","endAt","sortOrder","autoSlide","durationMs","isActive","createdAt","updatedAt") VALUES (${id},${d.key},${d.placement},${d.title ?? null},${d.subtitle ?? null},${d.ctaLabel ?? null},${d.href ?? null},${d.desktopImageUrl},${d.mobileImageUrl ?? null},${d.startAt ? new Date(d.startAt) : null},${d.endAt ? new Date(d.endAt) : null},${d.sortOrder},${d.autoSlide},${d.durationMs},${d.isActive},NOW(),NOW()) ON CONFLICT ("key") DO UPDATE SET "placement"=EXCLUDED."placement","title"=EXCLUDED."title","subtitle"=EXCLUDED."subtitle","ctaLabel"=EXCLUDED."ctaLabel","href"=EXCLUDED."href","desktopImageUrl"=EXCLUDED."desktopImageUrl","mobileImageUrl"=EXCLUDED."mobileImageUrl","startAt"=EXCLUDED."startAt","endAt"=EXCLUDED."endAt","sortOrder"=EXCLUDED."sortOrder","autoSlide"=EXCLUDED."autoSlide","durationMs"=EXCLUDED."durationMs","isActive"=EXCLUDED."isActive","updatedAt"=NOW()`;
    return jsonOk({ id, key: d.key }, { status: 201 });
  } catch { return jsonError('save_failed', 'Failed to save banner', { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  const g = await requireAdminApi('banners.manage'); if (!g.ok) return g.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  const id = new URL(req.url).searchParams.get('id'); if (!id) return jsonError('invalid_id', 'Banner id is required', { status: 400 });
  try { const result = await prisma.$executeRaw`DELETE FROM "Banner" WHERE "id"=${id}`; if (Number(result)===0) return jsonError('not_found','Banner not found',{status:404}); return jsonOk({deleted:true}); }
  catch { return jsonError('delete_failed','Failed to delete banner',{status:500}); }
}
