import type { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireSellerApi } from '@/lib/auth/require-seller-api';

export const dynamic = 'force-dynamic';

const phone = z.string().trim().regex(/^[0-9+\-\s]{6,20}$/, 'Invalid phone number');
const patchSchema = z.object({
  sellerShopName: z.string().trim().min(2).max(120).optional(),
  sellerBio: z.string().trim().max(1000).optional().nullable(),
  sellerLogoUrl: z.string().trim().max(500).optional().nullable(),
  sellerBannerUrl: z.string().trim().max(500).optional().nullable(),
  sellerWhatsapp: phone.optional().nullable(),
  sellerContactEmail: z.string().email().max(200).optional().nullable(),
  sellerContactPhone: phone.optional().nullable(),
  sellerAddress: z.string().trim().max(300).optional().nullable(),
  sellerCity: z.string().trim().max(120).optional().nullable(),
  sellerCountry: z.string().trim().max(120).optional().nullable(),
  sellerBankAccountNumber: z.string().trim().max(100).optional().nullable(),
  sellerBankAccountName: z.string().trim().max(200).optional().nullable(),
  sellerBankName: z.string().trim().max(120).optional().nullable(),
  sellerAtomaPay: z.string().trim().max(200).optional().nullable(),
  sellerInstagram: z.string().trim().max(300).optional().nullable(),
  sellerTelegram: z.string().trim().max(300).optional().nullable(),
  sellerFacebook: z.string().trim().max(300).optional().nullable(),
  sellerLinkedin: z.string().trim().max(300).optional().nullable(),
  sellerWebsite: z.string().trim().max(300).optional().nullable(),
});

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

const slugify = (value: string) =>
  value.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || `brand-${Date.now()}`;

async function syncSellerBrand(userId: string) {
  const seller = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, fullName: true, sellerShopName: true, sellerBio: true,
      sellerLogoUrl: true, sellerBannerUrl: true, sellerWebsite: true,
      sellerCountry: true, sellerContactEmail: true, sellerContactPhone: true,
      sellerInstagram: true, sellerFacebook: true, sellerTelegram: true, sellerLinkedin: true,
    },
  });
  if (!seller) throw new Error('SELLER_NOT_FOUND');
  const name = seller.sellerShopName?.trim() || seller.fullName?.trim() || 'برند فروشگاه';
  const existing = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id" FROM "SellerBrand" WHERE "sellerId" = ${seller.id} LIMIT 1
  `);
  if (existing[0]) {
    await prisma.$executeRaw(Prisma.sql`
      UPDATE "SellerBrand"
      SET "name"=${name}, "description"=${seller.sellerBio}, "logoUrl"=${seller.sellerLogoUrl},
          "bannerUrl"=${seller.sellerBannerUrl}, "website"=${seller.sellerWebsite}, "country"=${seller.sellerCountry},
          "contactEmail"=${seller.sellerContactEmail}, "contactPhone"=${seller.sellerContactPhone},
          "instagram"=${seller.sellerInstagram}, "facebook"=${seller.sellerFacebook},
          "telegram"=${seller.sellerTelegram}, "linkedin"=${seller.sellerLinkedin}, "updatedAt"=CURRENT_TIMESTAMP
      WHERE "sellerId"=${seller.id}
    `);
    return;
  }
  const id = `brand_${seller.id}`;
  const brandSlug = `${slugify(name)}-${seller.id.slice(0, 8)}`;
  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "SellerBrand" ("id","sellerId","name","slug","description","logoUrl","bannerUrl","website","country","contactEmail","contactPhone","instagram","facebook","telegram","linkedin","isActive","createdAt","updatedAt")
    VALUES (${id},${seller.id},${name},${brandSlug},${seller.sellerBio},${seller.sellerLogoUrl},${seller.sellerBannerUrl},${seller.sellerWebsite},${seller.sellerCountry},${seller.sellerContactEmail},${seller.sellerContactPhone},${seller.sellerInstagram},${seller.sellerFacebook},${seller.sellerTelegram},${seller.sellerLinkedin},true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    ON CONFLICT ("sellerId") DO NOTHING
  `);
}

export async function OPTIONS() { return jsonPreflight(); }

export async function GET() {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
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
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  let body: unknown;
  try { body = await req.json(); } catch { return jsonError('invalid_json', 'Invalid JSON', { status: 400 }); }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError('invalid_body', 'Invalid settings payload', { status: 422, details: { issues: parsed.error.issues } });
  if (!Object.keys(parsed.data).length) return jsonError('empty_body', 'Nothing to update', { status: 400 });

  try {
    const updated = await prisma.user.update({ where: { id: guard.user.id }, data: parsed.data, select: SETTINGS_SELECT });
    let brandSynced = true;
    try {
      await syncSellerBrand(guard.user.id);
    } catch (brandError) {
      brandSynced = false;
      console.error('[seller/settings.PATCH] brand sync skipped after successful seller save', brandError);
    }
    return jsonOk({ ...updated, source: 'db' as const, brandSynced });
  } catch (error) {
    console.error('[seller/settings.PATCH]', error);
    const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code) : '';
    if (code === 'P2002') return jsonError('duplicate', 'A unique seller value already exists.', { status: 409 });
    return jsonError('update_failed', 'Seller settings could not be saved.', { status: 500 });
  }
}

export async function DELETE() {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  try {
    const updated = await prisma.user.update({ where: { id: guard.user.id }, data: { isActive: false }, select: { id: true, isActive: true } });
    try {
      await prisma.$executeRaw(Prisma.sql`UPDATE "SellerBrand" SET "isActive"=false,"updatedAt"=CURRENT_TIMESTAMP WHERE "sellerId"=${guard.user.id}`);
    } catch (brandError) {
      console.error('[seller/settings.DELETE] brand deactivation skipped after seller deactivation', brandError);
    }
    return jsonOk(updated);
  } catch (error) {
    console.error('[seller/settings.DELETE]', error);
    return jsonError('delete_failed', 'Store could not be deactivated.', { status: 500 });
  }
}
