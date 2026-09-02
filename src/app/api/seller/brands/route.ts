import type { NextRequest } from 'next/server';
import crypto from 'node:crypto';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';

export const dynamic = 'force-dynamic';
const schema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  logoUrl: z.string().trim().max(500).optional().nullable(),
}).strict();
const slugify = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);

export async function OPTIONS() { return jsonPreflight(); }

export async function GET() {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  try {
    const rows = await prisma.$queryRaw<Array<{ id: string; name: string; slug: string; description: string | null; logoUrl: string | null; isActive: boolean; createdAt: Date; productCount: bigint }>>`
      SELECT b."id", b."name", b."slug", b."description", b."logoUrl", b."isActive", b."createdAt",
             COUNT(p."id") AS "productCount"
      FROM "SellerBrand" b
      LEFT JOIN "Product" p ON p."brandId" = b."id"
      WHERE b."sellerId" = ${guard.user.id}
      GROUP BY b."id"
      ORDER BY b."createdAt" DESC
    `;
    return jsonOk(rows.map((row) => ({ ...row, productCount: Number(row.productCount) })));
  } catch (error) {
    console.error('[seller/brands.GET]', error);
    return jsonError('query_failed', 'Unable to load brands', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  if (guard.user.role === 'admin') return jsonError('seller_context_required', 'Seller context required', { status: 403 });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  let body: unknown;
  try { body = await request.json(); } catch { return jsonError('invalid_json', 'Invalid JSON', { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError('invalid_body', 'اطلاعات برند نامعتبر است.', { status: 422, details: { issues: parsed.error.issues } });
  const slug = slugify(parsed.data.slug || parsed.data.name);
  if (!slug) return jsonError('invalid_slug', 'شناسه برند نامعتبر است.', { status: 422 });
  try {
    const id = crypto.randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "SellerBrand" ("id","sellerId","name","slug","description","logoUrl","isActive","createdAt","updatedAt")
      VALUES (${id},${guard.user.id},${parsed.data.name},${slug},${parsed.data.description ?? null},${parsed.data.logoUrl ?? null},true,NOW(),NOW())
    `;
    return jsonOk({ id, name: parsed.data.name, slug }, { status: 201 });
  } catch (error) {
    if (String(error).toLowerCase().includes('duplicate') || String(error).includes('P2002')) return jsonError('duplicate', 'این برند قبلاً برای فروشگاه شما ثبت شده است.', { status: 409 });
    console.error('[seller/brands.POST]', error);
    return jsonError('create_failed', 'ایجاد برند ناموفق بود.', { status: 500 });
  }
}
