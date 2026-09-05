/** Seller inventory API — stock levels, filters and summary counters. */
import type { NextRequest } from 'next/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { requireSellerApi } from '@/lib/auth/require-seller-api';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const STATUS_FILTERS = ['all', 'low', 'out', 'healthy'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export async function OPTIONS() { return jsonPreflight(); }

export async function GET(req: NextRequest) {
  const guard = await requireSellerApi();
  if (!guard.ok) return guard.response;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'پایگاه داده در دسترس نیست.', { status: 503 });

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number.parseInt(sp.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(50, Math.max(10, Number.parseInt(sp.get('pageSize') ?? '25', 10) || 25));
  const q = sp.get('q')?.trim() ?? '';
  const statusParam = sp.get('status');
  const status: StatusFilter = STATUS_FILTERS.includes(statusParam as StatusFilter) ? (statusParam as StatusFilter) : 'all';
  const sellerId = guard.user.role === 'admin' ? (sp.get('sellerId') ?? undefined) : guard.user.id;
  if (guard.user.role !== 'admin' && !sellerId) return jsonError('forbidden', 'شناسه فروشنده مشخص نیست.', { status: 403 });

  try {
    const baseWhere = sellerId ? { sellerId } : {};
    const filteredWhere = {
      ...baseWhere,
      ...(q
        ? { OR: [{ name: { contains: q, mode: 'insensitive' as const } }, { slug: { contains: q, mode: 'insensitive' as const } }] }
        : {}),
      ...(status === 'low' ? { stockQuantity: { gt: 0, lte: 5 } } : {}),
      ...(status === 'out' ? { stockQuantity: { lte: 0 } } : {}),
      ...(status === 'healthy' ? { stockQuantity: { gt: 5 } } : {}),
    };

    const [total, rows, totalProducts, lowStock, outOfStock] = await Promise.all([
      prisma.product.count({ where: filteredWhere }),
      prisma.product.findMany({
        where: filteredWhere,
        select: {
          id: true, slug: true, name: true, price: true, currency: true,
          stockQuantity: true, inStock: true, isActive: true, updatedAt: true,
          category: { select: { name: true } },
        },
        orderBy: [{ stockQuantity: 'asc' }, { updatedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where: baseWhere }),
      prisma.product.count({ where: { ...baseWhere, isActive: true, stockQuantity: { gt: 0, lte: 5 } } }),
      prisma.product.count({ where: { ...baseWhere, stockQuantity: { lte: 0 } } }),
    ]);

    const items = rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: Number(p.price),
      currency: p.currency,
      categoryName: p.category.name,
      stockQuantity: p.stockQuantity,
      inStock: p.inStock,
      isActive: p.isActive,
      updatedAt: p.updatedAt.toISOString(),
    }));

    return jsonOk({ items, summary: { totalProducts, lowStock, outOfStock } }, {
      meta: { total, page, pageSize, status, source: 'db' },
    });
  } catch (error) {
    logger.error('seller.inventory.list_failed', { userId: guard.user.id }, error);
    return jsonError('internal_error', 'دریافت موجودی ناموفق بود.', { status: 500 });
  }
}
