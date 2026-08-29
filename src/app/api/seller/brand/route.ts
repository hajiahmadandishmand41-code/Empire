import type { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireSellerApi } from '@/lib/auth/require-seller-api';

export const dynamic = 'force-dynamic';

const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();
const brandSchema = z.object({
  name: z.string().trim().min(2).max(120), slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(), description: optionalText(1500), logoUrl: optionalText(500), bannerUrl: optionalText(500), website: optionalText(300), country: optionalText(120), contactEmail: z.string().trim().email().max(200).optional().nullable(), contactPhone: optionalText(40), instagram: optionalText(300), facebook: optionalText(300), telegram: optionalText(300), linkedin: optionalText(300), attributesJson: optionalText(4000), isActive: z.boolean().optional(),
}).strict();

function slugify(value: string) { const slug = value.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70); return slug || `brand-${Date.now()}`; }

async function ensureSellerBrand(sellerId: string) {
  const existing = await prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`SELECT * FROM "SellerBrand" WHERE "sellerId" = ${sellerId} LIMIT 1`);
  if (existing[0]) return existing[0];
  const seller = await prisma.user.findUnique({ where: { id: sellerId }, select: { fullName: true, sellerShopName: true, sellerBio: true, sellerLogoUrl: true, sellerBannerUrl: true, sellerWebsite: true, sellerCountry: true, sellerContactEmail: true, sellerContactPhone: true, sellerInstagram: true, sellerFacebook: true, sellerTelegram: true, sellerLinkedin: true } });
  if (!seller) return null;
  const name = seller.sellerShopName?.trim() || seller.fullName;
  const id = `brand_${sellerId}`;
  const slug = `${slugify(name)}-${sellerId.slice(0, 8)}`;
  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`INSERT INTO "SellerBrand" ("id","sellerId","name","slug","description","logoUrl","bannerUrl","website","country","contactEmail","contactPhone","instagram","facebook","telegram","linkedin") VALUES (${id},${sellerId},${name},${slug},${seller.sellerBio},${seller.sellerLogoUrl},${seller.sellerBannerUrl},${seller.sellerWebsite},${seller.sellerCountry},${seller.sellerContactEmail},${seller.sellerContactPhone},${seller.sellerInstagram},${seller.sellerFacebook},${seller.sellerTelegram},${seller.sellerLinkedin}) ON CONFLICT ("sellerId") DO UPDATE SET "updatedAt" = CURRENT_TIMESTAMP RETURNING *`);
  return rows[0] ?? null;
}

export async function OPTIONS() { return jsonPreflight(); }

export async function GET() {
  const guard = await requireSellerApi(); if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  const brand = await ensureSellerBrand(guard.user.id); if (!brand) return jsonError('not_found', 'Seller not found', { status: 404 });
  return jsonOk(brand);
}

export async function PATCH(req: NextRequest) {
  const guard = await requireSellerApi(); if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  let body: unknown; try { body = await req.json(); } catch { return jsonError('invalid_json', 'Invalid JSON', { status: 400 }); }
  const parsed = brandSchema.safeParse(body); if (!parsed.success) return jsonError('invalid_body', 'Invalid brand payload', { status: 422, details: { issues: parsed.error.issues } });
  const current = await ensureSellerBrand(guard.user.id); if (!current) return jsonError('not_found', 'Seller not found', { status: 404 });
  const data = parsed.data; const slug = data.slug ?? String(current.slug); const attributes = data.attributesJson == null ? null : data.attributesJson; const isActive = data.isActive ?? null;
  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`UPDATE "SellerBrand" SET "name"=${data.name},"slug"=${slug},"description"=${data.description ?? null},"logoUrl"=${data.logoUrl ?? null},"bannerUrl"=${data.bannerUrl ?? null},"website"=${data.website ?? null},"country"=${data.country ?? null},"contactEmail"=${data.contactEmail ?? null},"contactPhone"=${data.contactPhone ?? null},"instagram"=${data.instagram ?? null},"facebook"=${data.facebook ?? null},"telegram"=${data.telegram ?? null},"linkedin"=${data.linkedin ?? null},"attributesJson"=CASE WHEN ${attributes}::text IS NULL THEN "attributesJson" ELSE ${attributes}::jsonb END,"isActive"=COALESCE(${isActive},"isActive"),"updatedAt"=CURRENT_TIMESTAMP WHERE "sellerId"=${guard.user.id} RETURNING *`);
  return jsonOk(rows[0] ?? current);
}
