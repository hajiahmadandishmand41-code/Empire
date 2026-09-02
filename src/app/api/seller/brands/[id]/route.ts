import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import { jsonError, jsonOk } from '@/lib/api/response';

export const dynamic = 'force-dynamic';
const schema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  slug: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  logoUrl: z.string().trim().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
}).strict();
const slugify = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);

async function ownsBrand(id: string, sellerId: string) {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "SellerBrand" WHERE "id" = ${id} AND "sellerId" = ${sellerId} LIMIT 1
  `;
  return Boolean(rows[0]);
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  const { id } = await params;
  try {
    const rows = await prisma.$queryRaw<Array<Record<string, unknown> & { productCount: bigint }>>`
      SELECT b."id", b."name", b."slug", b."description", b."logoUrl", b."isActive", b."createdAt", b."updatedAt",
             COUNT(p."id") AS "productCount"
      FROM "SellerBrand" b
      LEFT JOIN "Product" p ON p."brandId" = b."id"
      WHERE b."id" = ${id} AND b."sellerId" = ${guard.user.id}
      GROUP BY b."id"
      LIMIT 1
    `;
    if (!rows[0]) return jsonError('not_found', 'برند پیدا نشد.', { status: 404 });
    return jsonOk({ ...rows[0], productCount: Number(rows[0].productCount) });
  } catch (error) {
    console.error('[seller/brands/id.GET]', error);
    return jsonError('query_failed', 'خواندن برند ناموفق بود.', { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  if (guard.user.role === 'admin') return jsonError('seller_context_required', 'Seller context required', { status: 403 });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  const { id } = await params;
  if (!(await ownsBrand(id, guard.user.id))) return jsonError('not_found', 'برند پیدا نشد.', { status: 404 });
  let body: unknown;
  try { body = await request.json(); } catch { return jsonError('invalid_json', 'Invalid JSON', { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError('invalid_body', 'اطلاعات برند نامعتبر است.', { status: 422, details: { issues: parsed.error.issues } });
  const data = parsed.data;
  try {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updates.name = data.name;
    if (data.slug !== undefined) updates.slug = slugify(data.slug);
    if (data.description !== undefined) updates.description = data.description;
    if (data.logoUrl !== undefined) updates.logoUrl = data.logoUrl;
    if (data.isActive !== undefined) updates.isActive = data.isActive;
    const columns = Object.keys(updates);
    const values = Object.values(updates);
    const assignments = columns.map((column, index) => `"${column}" = $${index + 1}`).join(', ');
    const result = await prisma.$executeRawUnsafe(
      `UPDATE "SellerBrand" SET ${assignments} WHERE "id" = $${values.length + 1} AND "sellerId" = $${values.length + 2}`,
      ...values,
      id,
      guard.user.id,
    );
    if (result !== 1) return jsonError('not_found', 'برند پیدا نشد.', { status: 404 });
    return jsonOk({ id, ...data });
  } catch (error) {
    if (String(error).toLowerCase().includes('duplicate')) return jsonError('duplicate', 'این slug قبلاً استفاده شده است.', { status: 409 });
    console.error('[seller/brands/id.PATCH]', error);
    return jsonError('update_failed', 'ویرایش برند ناموفق بود.', { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  if (guard.user.role === 'admin') return jsonError('seller_context_required', 'Seller context required', { status: 403 });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });
  const { id } = await params;
  if (!(await ownsBrand(id, guard.user.id))) return jsonError('not_found', 'برند پیدا نشد.', { status: 404 });
  try {
    await prisma.$executeRaw`UPDATE "SellerBrand" SET "isActive" = false, "updatedAt" = NOW() WHERE "id" = ${id} AND "sellerId" = ${guard.user.id}`;
    return jsonOk({ id, isActive: false });
  } catch (error) {
    console.error('[seller/brands/id.DELETE]', error);
    return jsonError('delete_failed', 'غیرفعال‌سازی برند ناموفق بود.', { status: 500 });
  }
}
