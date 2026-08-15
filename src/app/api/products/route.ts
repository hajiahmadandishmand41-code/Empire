/**
 * GET /api/products
 *
 * Public product listing with professional ranking algorithm.
 *
 * Architecture:
 *   - Uses ProductService (service layer) instead of raw Prisma
 *   - ProductService delegates to PrismaProductRepository
 *   - Ordering uses buildProductOrderBy() from the ranking algorithm module
 *   - In-memory re-ranking applied for search queries
 *   - Only real seller-registered products are returned (no demo/seed data)
 *
 * Supported query params:
 *   q            — full-text search (name, description, category, region)
 *   categoryKey  — filter by taxonomy key
 *   sellerId     — filter by seller
 *   priceMin     — numeric lower bound (inclusive)
 *   priceMax     — numeric upper bound (inclusive)
 *   inStock      — "true" | "false"
 *   featured     — "true" | "false"
 *   badge        — filter by badge string
 *   sort         — "newest" | "priceAsc" | "priceDesc" | "bestSelling" |
 *                  "bestseller" | "mostViewed" | "popular" | "featured"
 *   page, pageSize (or limit)
 *
 * Smart default ordering (no sort param):
 *   1. In-stock products first
 *   2. Best-selling products
 *   3. Most recent as tie-break
 */
import type { NextRequest } from 'next/server';
import { productListQuerySchema } from '@/lib/validation/product';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';
import { isDatabaseConfigured } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getProductService } from '@/server/infrastructure/registry';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return jsonPreflight();
}

export async function GET(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'products:list'), { limit: 120 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });

  // Validate query params via Zod schema
  const parsed = productListQuerySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) {
    return jsonError('invalid_query', 'Invalid query parameters', {
      status: 400,
      details: { issues: parsed.error.issues },
    });
  }

  const query = parsed.data;
  const effectiveLimit = query.limit ?? query.pageSize ?? 24;

  if (!isDatabaseConfigured()) {
    return jsonError('db_unavailable', 'Product catalog is unavailable', { status: 503 });
  }

  try {
    const svc = getProductService();
    const result = await svc.listProducts({
      q: query.q,
      categoryKey: query.categoryKey,
      sellerId: query.sellerId,
      priceMin: query.priceMin,
      priceMax: query.priceMax,
      inStock: query.inStock,
      featured: query.featured,
      hasDiscount: query.hasDiscount,
      badge: query.badge,
      sort: query.sort,
      page: query.page ?? 1,
      pageSize: effectiveLimit,
      rerank: Boolean(query.q), // Re-rank when searching
      isTraditional: (query as { isTraditional?: boolean }).isTraditional,
    });

    return jsonOk(result.products, {
      meta: {
        source: result.source,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        hasMore: result.hasMore,
      },
    });
  } catch (err) {
    logger.error('api.products.error', { route: '/api/products' }, err);

    return jsonError('internal_error', 'Failed to fetch products', { status: 500 });
  }
}
