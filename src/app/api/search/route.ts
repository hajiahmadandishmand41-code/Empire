/** GET /api/search — database-backed marketplace search. */
import type { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';
import { isDatabaseConfigured, prisma } from '@/lib/db';
import { getSearchService } from '@/server/infrastructure/registry';

export const dynamic = 'force-dynamic';

const searchQuerySchema = z.object({
  q: z.string().trim().max(200).optional().default(''),
  categoryKey: z.string().trim().max(80).optional(),
  sellerId: z.string().trim().max(80).optional(),
  brand: z.string().trim().max(120).optional(),
  priceMin: z.coerce.number().nonnegative().optional(),
  priceMax: z.coerce.number().nonnegative().optional(),
  inStock: z.union([z.literal('true'), z.literal('false')]).transform((v) => v === 'true').optional(),
  hasDiscount: z.union([z.literal('true'), z.literal('false')]).transform((v) => v === 'true').optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  sort: z.enum(['relevance', 'newest', 'priceAsc', 'priceDesc', 'bestSelling', 'popular', 'rating']).optional().default('relevance'),
  page: z.coerce.number().int().positive().max(1000).optional().default(1),
  pageSize: z.coerce.number().int().positive().max(48).optional().default(12),
});

export async function OPTIONS() {
  return jsonPreflight();
}

export async function GET(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'search:full'), { limit: 60 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });

  const parsed = searchQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams.entries()));
  if (!parsed.success) return jsonError('invalid_query', 'Invalid search parameters', { status: 400, details: { issues: parsed.error.issues } });
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Search is temporarily unavailable', { status: 503 });

  const { q, ...filters } = parsed.data;

  try {
    const result = await getSearchService().search({ q, ...filters });
    let storeResults: Array<{ id: string; name: string; bio: string | null; logoUrl: string | null; city: string | null; productCount: number; href: string }> = [];

    // Store search is supplemental and only meaningful for a non-empty query.
    if (q.trim()) {
      try {
        const stores = await prisma.user.findMany({
          where: {
            role: 'seller', sellerStatus: 'approved', isActive: true,
            OR: [
              { sellerShopName: { contains: q.trim(), mode: 'insensitive' } },
              { fullName: { contains: q.trim(), mode: 'insensitive' } },
            ],
          },
          select: { id: true, fullName: true, sellerShopName: true, sellerBio: true, sellerLogoUrl: true, sellerCity: true, _count: { select: { products: true } } },
          orderBy: { createdAt: 'desc' },
          take: 8,
        });
        storeResults = stores.map((store) => ({
          id: store.id,
          name: store.sellerShopName ?? store.fullName ?? 'Eshop Seller',
          bio: store.sellerBio,
          logoUrl: store.sellerLogoUrl,
          city: store.sellerCity,
          productCount: store._count.products,
          href: `/store/${store.id}`,
        }));
      } catch (error) {
        console.warn('[api/search] optional store lookup failed', error);
      }

      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO "SearchQueryStat" ("id","query","resultCount","searchCount","lastSearchedAt") VALUES ($1,$2,$3,1,NOW()) ON CONFLICT ("query") DO UPDATE SET "resultCount"=$3,"searchCount"="SearchQueryStat"."searchCount"+1,"lastSearchedAt"=NOW()`,
          randomUUID(), q.toLowerCase(), result.total,
        );
      } catch {
        // Analytics is deliberately non-blocking.
      }
    }

    return jsonOk(result.products, {
      meta: {
        source: 'db', query: result.meta.query, total: result.total, page: result.page, pageSize: result.pageSize,
        hasMore: result.hasMore, durationMs: result.meta.durationMs, reranked: result.meta.reranked,
        facets: result.meta.facets, stores: storeResults, storeCount: storeResults.length,
      },
    });
  } catch (err) {
    console.error('[api/search]', err);
    return jsonError('internal_error', 'Search failed. Please try again.', { status: 500 });
  }
}
