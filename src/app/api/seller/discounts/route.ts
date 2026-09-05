/** Seller discounts API — products with a compare-at price (on sale). */
import type { NextRequest } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function OPTIONS() { return jsonPreflight(); }

export async function GET(req: NextRequest) {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  if (guard.user.role === 'admin') {
    return jsonError('seller_context_required', 'این endpoint فقط برای حساب فروشنده است.', { status: 403 });
  }
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'پایگاه داده در دسترس نیست.', { status: 503 });

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number.parseInt(sp.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(50, Math.max(10, Number.parseInt(sp.get('pageSize') ?? '24', 10) || 24));
  const q = sp.get('q')?.trim() ?? '';

  try {
    const where = {
      sellerId: guard.user.id,
      compareAtPrice: { not: null },
      ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { slug: { contains: q, mode: 'insensitive' as const } }] } : {}),
    };
    const [total, rows] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        select: { id: true, slug: true, name: true, price: true, currency: true, compareAtPrice: true, isActive: true, category: { select: { name: true } } },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    const items = rows.map((p) => {
      const price = Number(p.price);
      const compareAtPrice = p.compareAtPrice == null ? null : Number(p.compareAtPrice);
      const discountPercent = compareAtPrice != null && compareAtPrice > price ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;
      return { id: p.id, slug: p.slug, name: p.name, categoryName: p.category.name, price, compareAtPrice, discountPercent, currency: p.currency, isActive: p.isActive };
    });
    return jsonOk(items, { meta: { total, page, pageSize, source: 'db' } });
  } catch (error) {
    logger.error('seller.discounts.list_failed', { userId: guard.user.id }, error);
    return jsonError('internal_error', 'دریافت تخفیف‌ها ناموفق بود.', { status: 500 });
  }
}
