/**
 * GET /api/search
 *
 * Professional search API with fuzzy matching, multi-field scoring,
 * and advanced filter support.
 *
 * Query params:
 *   q          — required search query (min 1 char)
 *   categoryKey — filter by category
 *   priceMin   — minimum price
 *   priceMax   — maximum price
 *   inStock    — "true" | "false"
 *   hasDiscount — "true" — only products with compareAtPrice set
 *   minRating  — minimum average rating (0-5)
 *   sort       — sort after re-ranking: "newest" | "priceAsc" | "priceDesc" |
 *                "bestSelling" | "mostViewed" | "popular"
 *   page, pageSize
 *
 * Returns:
 *   Standard ApiSuccess<ProductSummary[]> envelope with search metadata.
 */
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';
import { isDatabaseConfigured } from '@/lib/db';
import { getSearchService } from '@/server/infrastructure/registry';

export const dynamic = 'force-dynamic';

const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
  categoryKey: z.string().trim().max(80).optional(),
  priceMin: z.coerce.number().nonnegative().optional(),
  priceMax: z.coerce.number().nonnegative().optional(),
  inStock: z
    .union([z.literal('true'), z.literal('false')])
    .transform((v) => v === 'true')
    .optional(),
  hasDiscount: z
    .union([z.literal('true'), z.literal('false')])
    .transform((v) => v === 'true')
    .optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  sort: z
    .enum(['newest', 'priceAsc', 'priceDesc', 'bestSelling', 'mostViewed', 'popular'])
    .optional(),
  page: z.coerce.number().int().positive().max(1000).optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export async function OPTIONS() {
  return jsonPreflight();
}

export async function GET(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'search:full'), { limit: 60 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });

  const parsed = searchQuerySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) {
    return jsonError('invalid_query', 'Invalid search parameters', {
      status: 400,
      details: { issues: parsed.error.issues },
    });
  }

  const { q, ...filters } = parsed.data;

  if (!isDatabaseConfigured()) {
    return jsonError('db_unavailable', 'Search is unavailable', { status: 503 });
  }

  try {
    const svc = getSearchService();
    const result = await svc.search({ q, ...filters });

    return jsonOk(result.products, {
      meta: {
        source: 'db',
        query: result.meta.query,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        hasMore: result.hasMore,
        durationMs: result.meta.durationMs,
        reranked: result.meta.reranked,
      },
    });
  } catch (err) {
    console.error('[api/search]', err);
    return jsonError('internal_error', 'Search failed', { status: 500 });
  }
}
