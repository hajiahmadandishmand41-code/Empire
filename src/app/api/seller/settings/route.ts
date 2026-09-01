import type { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireSellerApi } from '@/lib/auth/require-seller-api';

export const dynamic = 'force-dynamic';

const PHONE_RE = /^[0-9+\-\s()]{6,24}$/;
const INTERNAL_MEDIA_PATH = /^\/api\/media\/[A-Za-z0-9_-]{8,120}$/;
const text = (max: number) => z.string().trim().max(max).optional().nullable();
const phone = z.string().trim().regex(PHONE_RE, 'شماره تماس معتبر نیست.').optional().nullable();
const mediaUrl = z.string().trim().max(500).optional().nullable().refine((value) => {
  if (value == null || value === '' || INTERNAL_MEDIA_PATH.test(value)) return true;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}, 'آدرس تصویر معتبر نیست.');
const httpUrl = z.string().trim().max(500).optional().nullable().refine((value) => {
  if (value == null || value === '') return true;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}, 'آدرس وب معتبر نیست.');

const patchSchema = z.object({
  sellerShopName: z.string().trim().min(2).max(120).optional(),
  sellerBio: text(1000),
  sellerLogoUrl: mediaUrl,
  sellerBannerUrl: mediaUrl,
  sellerWhatsapp: phone,
  sellerContactEmail: z.string().trim().email('ایمیل معتبر نیست.').max(200).optional().nullable(),
  sellerContactPhone: phone,
  sellerAddress: text(300),
  sellerCity: text(120),
  sellerCountry: text(120),
  sellerBankAccountNumber: text(100),
  sellerBankAccountName: text(200),
  sellerBankName: text(120),
  sellerAtomaPay: text(200),
  sellerInstagram: text(300),
  sellerTelegram: text(300),
  sellerFacebook: text(300),
  sellerLinkedin: text(300),
  sellerWebsite: httpUrl,
}).strict().refine((value) => Object.keys(value).length > 0, { message: 'هیچ تغییری برای ذخیره ارسال نشده است.' });

const SETTINGS_SELECT = {
  id: true,
  sellerShopName: true,
  sellerBio: true,
  sellerLogoUrl: true,
  sellerBannerUrl: true,
  sellerWhatsapp: true,
  sellerContactEmail: true,
  sellerContactPhone: true,
  sellerAddress: true,
  sellerCity: true,
  sellerCountry: true,
  sellerBankAccountNumber: true,
  sellerBankAccountName: true,
  sellerBankName: true,
  sellerAtomaPay: true,
  sellerInstagram: true,
  sellerTelegram: true,
  sellerFacebook: true,
  sellerLinkedin: true,
  sellerWebsite: true,
} as const;

const slugify = (value: string) => {
  const slug = value.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
  return slug || `brand-${Date.now()}`;
};

async function syncSellerBrandTx(tx: Prisma.TransactionClient, sellerId: string) {
  const seller = await tx.user.findUnique({
    where: { id: sellerId },
    select: {
      id: true,
      fullName: true,
      sellerShopName: true,
      sellerBio: true,
      sellerLogoUrl: true,
      sellerBannerUrl: true,
      sellerWebsite: true,
      sellerCountry: true,
      sellerContactEmail: true,
      sellerContactPhone: true,
      sellerInstagram: true,
      sellerFacebook: true,
      sellerTelegram: true,
      sellerLinkedin: true,
    },
  });
  if (!seller) throw new Error('SELLER_NOT_FOUND');

  const name = seller.sellerShopName?.trim() || seller.fullName?.trim() || 'برند فروشگاه';
  const current = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id" FROM "SellerBrand" WHERE "sellerId" = ${seller.id} LIMIT 1
  `);

  if (current[0]) {
    await tx.$executeRaw(Prisma.sql`
      UPDATE "SellerBrand"
      SET
        "name" = ${name},
        "description" = ${seller.sellerBio},
        "logoUrl" = ${seller.sellerLogoUrl},
        "bannerUrl" = ${seller.sellerBannerUrl},
        "website" = ${seller.sellerWebsite},
        "country" = ${seller.sellerCountry},
        "contactEmail" = ${seller.sellerContactEmail},
        "contactPhone" = ${seller.sellerContactPhone},
        "instagram" = ${seller.sellerInstagram},
        "facebook" = ${seller.sellerFacebook},
        "telegram" = ${seller.sellerTelegram},
        "linkedin" = ${seller.sellerLinkedin},
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE "sellerId" = ${seller.id}
    `);
    return;
  }

  const id = `brand_${seller.id}`;
  const brandSlug = `${slugify(name)}-${seller.id.slice(0, 8)}`;
  await tx.$executeRaw(Prisma.sql`
    INSERT INTO "SellerBrand" (
      "id","sellerId","name","slug","description","logoUrl","bannerUrl","website","country",
      "contactEmail","contactPhone","instagram","facebook","telegram","linkedin","isActive","createdAt","updatedAt"
    ) VALUES (
      ${id},${seller.id},${name},${brandSlug},${seller.sellerBio},${seller.sellerLogoUrl},${seller.sellerBannerUrl},${seller.sellerWebsite},${seller.sellerCountry},
      ${seller.sellerContactEmail},${seller.sellerContactPhone},${seller.sellerInstagram},${seller.sellerFacebook},${seller.sellerTelegram},${seller.sellerLinkedin},true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
    )
    ON CONFLICT ("sellerId") DO NOTHING
  `);
}

export async function OPTIONS() { return jsonPreflight(); }

export async function GET() {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  if (guard.user.role === 'admin') return jsonError('forbidden', 'Seller access required', { status: 403 });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  try {
    const row = await prisma.user.findUnique({ where: { id: guard.user.id }, select: SETTINGS_SELECT });
    if (!row) return jsonError('not_found', 'Seller not found', { status: 404 });
    return jsonOk({ ...row, source: 'db' as const });
  } catch (error) {
    console.error('[seller/settings.GET]', error);
    return jsonError('query_failed', 'Unable to load seller settings', { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  if (guard.user.role === 'admin') return jsonError('forbidden', 'Seller access required', { status: 403 });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('invalid_json', 'Invalid JSON', { status: 400 }); }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError('invalid_body', 'Invalid settings payload', { status: 422, details: { issues: parsed.error.issues } });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({ where: { id: guard.user.id }, data: parsed.data, select: SETTINGS_SELECT });
      await syncSellerBrandTx(tx, guard.user.id);
      return updated;
    });
    return jsonOk({ ...result, source: 'db' as const, brandSynced: true });
  } catch (error) {
    console.error('[seller/settings.PATCH]', error);
    const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code) : '';
    if (code === 'P2002' || code === '23505') return jsonError('duplicate', 'A unique seller value already exists.', { status: 409 });
    if (error instanceof Error && error.message === 'SELLER_NOT_FOUND') return jsonError('not_found', 'Seller not found', { status: 404 });
    return jsonError('update_failed', 'Seller settings could not be saved.', { status: 500 });
  }
}

export async function DELETE() {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  if (guard.user.role === 'admin') return jsonError('forbidden', 'Seller access required', { status: 403 });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  try {
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({ where: { id: guard.user.id }, data: { isActive: false }, select: { id: true, isActive: true } });
      await tx.$executeRaw(Prisma.sql`
        UPDATE "SellerBrand"
        SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "sellerId" = ${guard.user.id}
      `);
      return updated;
    });
    return jsonOk(result);
  } catch (error) {
    console.error('[seller/settings.DELETE]', error);
    return jsonError('delete_failed', 'Store could not be deactivated.', { status: 500 });
  }
}
