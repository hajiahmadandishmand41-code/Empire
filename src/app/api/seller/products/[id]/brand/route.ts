import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import { jsonError, jsonOk } from '@/lib/api/response';

export const dynamic = 'force-dynamic';
const schema = z.object({ brandId: z.string().trim().min(1).nullable() }).strict();

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  if (guard.user.role === 'admin') return jsonError('seller_context_required', 'Seller context required', { status: 403 });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Database is not configured', { status: 503 });

  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch { return jsonError('invalid_json', 'Invalid JSON', { status: 400 }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError('invalid_body', 'اطلاعات برند محصول نامعتبر است.', { status: 422 });

  try {
    const product = await prisma.product.findUnique({ where: { id }, select: { id: true, sellerId: true } });
    if (!product) return jsonError('not_found', 'محصول پیدا نشد.', { status: 404 });
    if (product.sellerId !== guard.user.id) return jsonError('forbidden', 'دسترسی مجاز نیست.', { status: 403 });

    if (parsed.data.brandId) {
      const rows = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "SellerBrand"
        WHERE "id" = ${parsed.data.brandId}
          AND "sellerId" = ${guard.user.id}
          AND "isActive" = true
        LIMIT 1
      `;
      if (!rows[0]) return jsonError('invalid_brand', 'برند فعال متعلق به این فروشنده پیدا نشد.', { status: 422 });
    }

    await prisma.$executeRaw`
      UPDATE "Product" SET "brandId" = ${parsed.data.brandId}
      WHERE "id" = ${id} AND "sellerId" = ${guard.user.id}
    `;

    return jsonOk({ productId: id, brandId: parsed.data.brandId });
  } catch (error) {
    console.error('[seller/products/brand]', error);
    return jsonError('update_failed', 'اتصال برند به محصول ناموفق بود.', { status: 500 });
  }
}
