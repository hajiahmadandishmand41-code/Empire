/**
 * GET /api/products
 *
 * Public product listing with professional ranking algorithm and
 * database-backed locale overlays (fa/en/ps).
 */
import type { NextRequest } from 'next/server';
import { productListQuerySchema } from '@/lib/validation/product';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';
import { isDatabaseConfigured } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getProductService } from '@/server/infrastructure/registry';
import { getProductLocalizedTexts, normalizeCatalogLocale } from '@/server/localization/product-localization';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return jsonPreflight();
}

export async function GET(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'products:list'), { limit: 120 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });

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
  const locale = normalizeCatalogLocale(req.nextUrl.searchParams.get('locale'));
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
      minRating: query.minRating,
      badge: query.badge,
      sort: query.sort,
      page: query.page ?? 1,
      pageSize: effectiveLimit,
      rerank: Boolean(query.q),
      isTraditional: query.isTraditional,
    });

    const localized = await getProductLocalizedTexts(
      result.products.map((product) => product.id),
      locale,
    );
    const products = result.products.map((product) => {
      const text = localized.get(product.id);
      return text
        ? { ...product, name: text.name, shortDescription: text.shortDescription }
        : product;
    });

    return jsonOk(products, {
      meta: {
        source: result.source,
        locale,
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
