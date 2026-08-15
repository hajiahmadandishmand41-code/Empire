import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireAdminApi } from '@/lib/auth/require-admin-api';
import { listAdminSellers } from '@/features/admin/lib/queries';
import type { SellerStatus } from '@/features/admin/lib/mock-data';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const createSellerSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(200).optional().or(z.literal('')),
    phone: z
      .string()
      .trim()
      .min(6)
      .max(30)
      .regex(/^[+()0-9\s-]+$/, 'invalid phone')
      .optional()
      .or(z.literal('')),
    shopName: z.string().trim().min(2).max(120),
    password: z.string().min(8).max(100),
  })
  .strict()
  .refine((v) => v.email || v.phone, {
    message: 'ایمیل یا شماره تماس الزامی است',
    path: ['email'],
  });

export async function OPTIONS() {
  return jsonPreflight();
}

export async function GET(req: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(50, Math.max(5, parseInt(sp.get('pageSize') ?? '10', 10) || 10));
  const status = (sp.get('status') as SellerStatus | 'all' | null) ?? undefined;
  try {
    const result = await listAdminSellers({
      q: sp.get('q') ?? undefined,
      status: status ?? undefined,
      page,
      pageSize,
    });
    return jsonOk(result, { meta: { source: result.source } });
  } catch (err) {
    logger.error('admin.sellers.list_failed', {}, err);
    const isDatabaseErr =
      err instanceof Error && err.message === 'Database not configured';
    return jsonError(
      isDatabaseErr ? 'db_unavailable' : 'query_failed',
      isDatabaseErr ? 'Database is not configured' : 'Failed to fetch sellers',
      { status: isDatabaseErr ? 503 : 500 },
    );
  }
}

/**
 * POST /api/admin/sellers
 * Admin creates a seller account directly — no application required.
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('invalid_json', 'Invalid JSON', { status: 400 });
  }

  const parsed = createSellerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('invalid_body', 'اطلاعات وارد شده نامعتبر است', {
      status: 422,
      details: { issues: parsed.error.flatten() },
    });
  }

  if (!isDatabaseConfigured()) {
    return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  }

  const { fullName, email, phone, shopName, password } = parsed.data;

  // Check for duplicate email/phone
  const existingWhere: Array<Record<string, unknown>> = [];
  if (email) existingWhere.push({ email });
  if (phone) existingWhere.push({ phone });

  const existing = existingWhere.length > 0
    ? await prisma.user.findFirst({ where: { OR: existingWhere } })
    : null;

  if (existing) {
    return jsonError('duplicate_user', 'کاربری با این ایمیل یا شماره تماس قبلاً وجود دارد', {
      status: 409,
    });
  }

  // Hash password
  const bcrypt = await import('bcryptjs');
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const seller = await prisma.user.create({
      data: {
        fullName,
        email: email || null,
        phone: phone || null,
        passwordHash,
        role: 'seller',
        sellerStatus: 'approved',
        sellerShopName: shopName,
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        sellerStatus: true,
        sellerShopName: true,
        createdAt: true,
      },
    });

    logger.info('admin.sellers.created', {
      adminId: guard.user.id,
      sellerId: seller.id,
      shopName,
    });

    return jsonOk({ seller }, { status: 201 });
  } catch (err) {
    logger.error('admin.sellers.create_failed', { adminId: guard.user.id }, err);
    return jsonError('create_failed', 'ایجاد فروشنده با خطا مواجه شد', { status: 500 });
  }
}
