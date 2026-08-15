/**
 * Seller Profile API — Phase 13 (Prisma)
 *
 * GET  /api/seller/profile
 * PATCH /api/seller/profile
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import { jsonError } from '@/lib/api/response';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const PROFILE_SELECT = {
  id: true,
  fullName: true,
  email: true,
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

const ALLOWED_PATCH_FIELDS = [
  'sellerShopName', 'sellerBio', 'sellerLogoUrl', 'sellerBannerUrl',
  'sellerWhatsapp', 'sellerContactEmail', 'sellerContactPhone',
  'sellerAddress', 'sellerCity', 'sellerCountry',
  'sellerBankAccountNumber', 'sellerBankAccountName', 'sellerBankName', 'sellerAtomaPay',
  'sellerInstagram', 'sellerTelegram', 'sellerFacebook', 'sellerLinkedin', 'sellerWebsite',
] as const;

type AllowedField = typeof ALLOWED_PATCH_FIELDS[number];

export async function GET() {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  try {
    const row = await prisma.user.findUnique({ where: { id: guard.user.id }, select: PROFILE_SELECT });
    if (!row) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true, data: { ...row, source: 'db' } });
  } catch (err) {
    logger.error('seller.profile.get_failed', { userId: guard.user.id }, err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return NextResponse.json({ ok: false, error: 'Database is not configured' }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    const raw: unknown = await req.json();
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return NextResponse.json({ ok: false, error: 'Invalid JSON object' }, { status: 400 });
    }
    body = raw as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const data: Partial<Record<AllowedField, string | null>> = {};
  for (const key of ALLOWED_PATCH_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      const v = body[key];
      data[key] = v === null || v === undefined ? null : String(v);
    }
  }
  if (Object.keys(data).length === 0) return NextResponse.json({ ok: false, error: 'Nothing to update' }, { status: 400 });

  try {
    await prisma.user.update({ where: { id: guard.user.id }, data });
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    logger.error('seller.profile.patch_failed', { userId: guard.user.id }, err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
