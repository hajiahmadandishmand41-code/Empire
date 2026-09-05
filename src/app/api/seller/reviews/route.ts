/** Seller reviews API — customer reviews on the seller's products. */
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
  const pageSize = Math.min(50, Math.max(10, Number.parseInt(sp.get('pageSize') ?? '20', 10) || 20));
  const q = sp.get('q')?.trim() ?? '';
  const statusParam = sp.get('status');
  const isApproved = statusParam === 'pending' ? false : statusParam === 'approved' ? true : undefined;
  const rating = Math.min(5, Math.max(1, Number.parseInt(sp.get('rating') ?? '', 10) || 0));

  try {
    const productFilter = { sellerId: guard.user.id, ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}) };
    const where = { product: productFilter, ...(isApproved === undefined ? {} : { isApproved }), ...(rating ? { rating } : {}) };

    const [total, approvedCount, pendingCount, aggregate, rows] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.count({ where: { product: { sellerId: guard.user.id }, isApproved: true } }),
      prisma.review.count({ where: { product: { sellerId: guard.user.id }, isApproved: false } }),
      prisma.review.aggregate({ where: { product: { sellerId: guard.user.id }, isApproved: true }, _avg: { rating: true } }),
      prisma.review.findMany({
        where,
        select: {
          id: true, rating: true, title: true, comment: true, isApproved: true, createdAt: true,
          product: { select: { id: true, name: true } },
          user: { select: { fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const items = rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      isApproved: r.isApproved,
      createdAt: r.createdAt.toISOString(),
      productId: r.product.id,
      productName: r.product.name,
      customerName: r.user?.fullName ?? null,
    }));

    return jsonOk(items, {
      meta: {
        total, page, pageSize,
        approvedCount, pendingCount,
        averageRating: Number((aggregate._avg.rating ?? 0).toFixed(1)),
        source: 'db',
      },
    });
  } catch (error) {
    logger.error('seller.reviews.list_failed', { userId: guard.user.id }, error);
    return jsonError('internal_error', 'دریافت نظرات ناموفق بود.', { status: 500 });
  }
}
