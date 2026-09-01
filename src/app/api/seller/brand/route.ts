import type { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireSellerApi } from '@/lib/auth/require-seller-api';

export const dynamic = 'force-dynamic';

const INTERNAL_MEDIA_PATH = /^\/api\/media\/[A-Za-z0-9_-]{8,80}$/;
const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();
const optionalHttpUrl = (max: number) => optionalText(max).refine((value) => {
  if (value == null || value === '') return true;
  try { const url = new URL(value); return url.protocol === 'http:' || url.protocol === 'https:'; } catch { return false; }
}, 'Invalid URL');
const optionalMediaUrl = (max: number) => optionalText(max).refine((value) => {
  if (value == null || value === '' || INTERNAL_MEDIA_PATH.test(value)) return true;
  try { const url = new URL(value); return url.protocol === 'http:' || url.protocol === 'https:'; } catch { return false; }
}, 'Invalid media URL');
const optionalJson = optionalText(4000).refine((value) => {
  if (value == null || value === '') return true;
  try { JSON.parse(value); return true; } catch { return false; }
}, 'attributesJson must contain valid JSON');

const brandSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  description: optionalText(1500),
  logoUrl: optionalMediaUrl(500),
  bannerUrl: optionalMediaUrl(500),
  website: optionalHttpUrl(300),
  country: optionalText(120),
  contactEmail: z.string().trim().email().max(200).optional().nullable(),
  contactPhone: optionalText(40),
  instagram: optionalHttpUrl(300),
  facebook: optionalHttpUrl(300),
  telegram: optionalHttpUrl(300),
  linkedin: optionalHttpUrl(300),
  attributesJson: optionalJson,
  isActive: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, { message: 'At least one brand field is required' });

const slugify = (value: string) => {
  const slug = value.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
  return slug || `brand-${Date.now()}`;
};

async function ensureSellerBrand(sellerId: string) {
  const existing = await prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
    SELECT * FROM "SellerBrand" WHERE "sellerId" = ${sellerId} LIMIT 1
  `);
  if (existing[0]) {
    if (existing[0].isActive === false) {
      const restored = await prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
        UPDATE "SellerBrand" SET "isActive" = true, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "sellerId" = ${sellerId} RETURNING *
      `);
      return restored[0] ?? existing[0];
    }
    return existing[0];
  }

  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: {
      fullName: true, sellerShopName: true, sellerBio: true, sellerLogoUrl: true, sellerBannerUrl: true,
      sellerWebsite: true, sellerCountry: true, sellerContactEmail: true, sellerContactPhone: true,
      sellerInstagram: true, sellerFacebook: true, sellerTelegram: true, sellerLinkedin: true,
    },
  });
  if (!seller) return null;

  const name = seller.sellerShopName?.trim() || seller.fullName?.trim() || 'برند فروشگاه';
  const id = `brand_${sellerId}`;
  const slug = `${slugify(name)}-${sellerId.slice(0, 8)}`;
  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
    INSERT INTO "SellerBrand" (
      "id","sellerId","name","slug","description","logoUrl","bannerUrl","website","country",
      "contactEmail","contactPhone","instagram","facebook","telegram","linkedin","isActive","createdAt","updatedAt"
    ) VALUES (
      ${id},${sellerId},${name},${slug},${seller.sellerBio},${seller.sellerLogoUrl},${seller.sellerBannerUrl},${seller.sellerWebsite},${seller.sellerCountry},
      ${seller.sellerContactEmail},${seller.sellerContactPhone},${seller.sellerInstagram},${seller.sellerFacebook},${seller.sellerTelegram},${seller.sellerLinkedin},true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
    )
    ON CONFLICT ("sellerId") DO UPDATE SET "isActive"=true,"updatedAt"=CURRENT_TIMESTAMP
    RETURNING *
  `);
  return rows[0] ?? null;
}

export async function OPTIONS() { return jsonPreflight(); }

export async function GET() {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  if (guard.user.role === 'admin') return jsonError('forbidden', 'Seller access required', { status: 403 });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  try {
    const brand = await ensureSellerBrand(guard.user.id);
    if (!brand) return jsonError('not_found', 'Seller not found', { status: 404 });
    return jsonOk(brand);
  } catch (error) {
    console.error('[seller/brand.GET]', error);
    return jsonError('query_failed', 'Unable to load brand', { status: 500 });
  }
}

export async function POST() {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  if (guard.user.role === 'admin') return jsonError('forbidden', 'Seller access required', { status: 403 });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  try {
    const brand = await ensureSellerBrand(guard.user.id);
    if (!brand) return jsonError('not_found', 'Seller not found', { status: 404 });
    return jsonOk(brand, { status: 201 });
  } catch (error) {
    console.error('[seller/brand.POST]', error);
    return jsonError('create_failed', 'Brand could not be created', { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  if (guard.user.role === 'admin') return jsonError('forbidden', 'Seller access required', { status: 403 });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('invalid_json', 'Invalid JSON', { status: 400 }); }
  const parsed = brandSchema.safeParse(body);
  if (!parsed.success) return jsonError('invalid_body', 'Invalid brand payload', { status: 422, details: { issues: parsed.error.issues } });

  try {
    const current = await ensureSellerBrand(guard.user.id);
    if (!current) return jsonError('not_found', 'Seller not found', { status: 404 });
    const d = parsed.data;
    const parts: Prisma.Sql[] = [Prisma.sql`"updatedAt" = CURRENT_TIMESTAMP`];
    if (d.name !== undefined) parts.push(Prisma.sql`"name" = ${d.name}`);
    if (d.slug !== undefined) parts.push(Prisma.sql`"slug" = ${d.slug}`);
    for (const [column, value] of [['description', d.description],['logoUrl', d.logoUrl],['bannerUrl', d.bannerUrl],['website', d.website],['country', d.country],['contactEmail', d.contactEmail],['contactPhone', d.contactPhone],['instagram', d.instagram],['facebook', d.facebook],['telegram', d.telegram],['linkedin', d.linkedin]] as const) {
      if (value !== undefined) parts.push(Prisma.sql`${Prisma.raw(`"${column}"`)} = ${value}`);
    }
    if (d.attributesJson !== undefined) parts.push(d.attributesJson == null || d.attributesJson === '' ? Prisma.sql`"attributesJson" = NULL` : Prisma.sql`"attributesJson" = ${d.attributesJson}::jsonb`);
    if (d.isActive !== undefined) parts.push(Prisma.sql`"isActive" = ${d.isActive}`);
    const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>(Prisma.sql`
      UPDATE "SellerBrand" SET ${Prisma.join(parts, ', ')} WHERE "sellerId" = ${guard.user.id} RETURNING *
    `);
    if (!rows[0]) return jsonError('update_failed', 'Brand update failed', { status: 500 });
    return jsonOk(rows[0]);
  } catch (error: unknown) {
    const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code) : '';
    if (code === '23505' || code === 'P2002') return jsonError('duplicate_slug', 'A brand with this slug already exists.', { status: 409 });
    console.error('[seller/brand.PATCH]', error);
    return jsonError('update_failed', 'Brand update failed', { status: 500 });
  }
}

export async function DELETE() {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  if (guard.user.role === 'admin') return jsonError('forbidden', 'Seller access required', { status: 403 });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  try {
    const result = await prisma.$transaction(async (tx) => {
      const brand = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT "id" FROM "SellerBrand" WHERE "sellerId" = ${guard.user.id} LIMIT 1`);
      if (!brand[0]) return null;
      await tx.$executeRaw(Prisma.sql`UPDATE "Product" SET "brandId" = NULL WHERE "brandId" = ${brand[0].id}`);
      await tx.$executeRaw(Prisma.sql`UPDATE "SellerBrand" SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${brand[0].id}`);
      return { id: brand[0].id, isActive: false };
    });
    if (!result) return jsonError('not_found', 'Brand not found', { status: 404 });
    return jsonOk(result);
  } catch (error) {
    console.error('[seller/brand.DELETE]', error);
    return jsonError('delete_failed', 'Brand could not be deactivated', { status: 500 });
  }
}
