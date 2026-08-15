/**
 * Seller store settings API.
 * GET  /api/seller/settings  → current seller's store profile (incl. payment accounts)
 * PATCH /api/seller/settings → update logo/banner/contact/whatsapp/payment accounts
 *
 * Stage 6 fixes:
 *  - GET:  replaced $queryRawUnsafe with prisma.user.findUnique() — typed, no raw SQL.
 *  - PATCH: replaced $executeRawUnsafe (dynamic-column raw SQL) with
 *           prisma.user.update() — eliminates SQL-construction risk and is fully
 *           type-safe. Prisma handles updatedAt automatically.
 */
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireSellerApi } from '@/lib/auth/require-seller-api';

export const dynamic = 'force-dynamic';

const phone = z
  .string()
  .trim()
  .regex(/^[0-9+\-\s]{6,20}$/, 'Invalid phone number');

const patchSchema = z.object({
  sellerShopName: z.string().trim().min(2).max(120).optional(),
  sellerBio: z.string().trim().max(1000).optional().nullable(),
  sellerLogoUrl: z.string().max(500).optional().nullable(),
  sellerBannerUrl: z.string().max(500).optional().nullable(),
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

export async function OPTIONS() {
  return jsonPreflight();
}

export async function GET() {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;

  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  // FIX: use typed prisma.user.findUnique() instead of $queryRawUnsafe.
  const row = await prisma.user.findUnique({
    where: { id: guard.user.id },
    select: SETTINGS_SELECT,
  });
  if (!row) return jsonError('not_found', 'Seller not found', { status: 404 });
  return jsonOk({ ...row, source: 'db' as const });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('invalid_json', 'Invalid JSON', { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('invalid_body', 'Invalid settings payload', {
      status: 422,
      details: { issues: parsed.error.issues },
    });
  }
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  const data = parsed.data;
  if (Object.keys(data).length === 0) {
    return jsonError('empty_body', 'Nothing to update', { status: 400 });
  }

  // FIX: use typed prisma.user.update() — no raw SQL, updatedAt managed by Prisma.
  await prisma.user.update({
    where: { id: guard.user.id },
    data,
  });
  return jsonOk({ ...data, id: guard.user.id });
}
