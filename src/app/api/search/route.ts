/** GET /api/search — database-backed search for products and seller storefronts. */
import type { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { jsonError, jsonOk, jsonPreflight } from '@/lib/api/response';
import { clientKey, rateLimitAsync } from '@/lib/api/rate-limit';
import { isDatabaseConfigured, prisma } from '@/lib/db';
import { getSearchService } from '@/server/infrastructure/registry';

export const dynamic = 'force-dynamic';

const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
  categoryKey: z.string().trim().max(80).optional(),
  priceMin: z.coerce.number().nonnegative().optional(),
  priceMax: z.coerce.number().nonnegative().optional(),
  inStock: z.union([z.literal('true'), z.literal('false')]).transform((v) => v === 'true').optional(),
  hasDiscount: z.union([z.literal('true'), z.literal('false')]).transform((v) => v === 'true').optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  sort: z.enum(['newest', 'priceAsc', 'priceDesc', 'bestSelling', 'mostViewed', 'popular']).optional(),
  page: z.coerce.number().int().positive().max(1000).optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export async function OPTIONS() {
  return jsonPreflight();
}

export async function GET(req: NextRequest) {
  const rl = await rateLimitAsync(clientKey(req, 'search:full'), { limit: 60 });
  if (!rl.ok) return jsonError('rate_limited', 'Too many requests', { status: 429 });

  const parsed = searchQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams.entries()));
  if (!parsed.success) {
    return jsonError('invalid_query', 'Invalid search parameters', {
      status: 400,
      details: { issues: parsed.error.issues },
    });
  }

  const { q, ...filters } = parsed.data;
  if (!isDatabaseConfigured()) return jsonError('db_unavailable', 'Search is unavailable', { status: 503 });

  try {
    const result = await getSearchService().search({ q, ...filters });
    const storeQuery = q.trim();
    let storeResults: Array<{
      id: string;
      name: string;
      bio: string | null;
      logoUrl: string | null;
      city: string | null;
      productCount: number;
      href: string;
    }> = [];

    try {
      const stores = await prisma.user.findMany({
        where: {
          role: 'seller',
          sellerStatus: 'approved',
          isActive: true,
          OR: [
            { sellerShopName: { contains: storeQuery, mode: 'insensitive' } },
            { fullName: { contains: storeQuery, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          fullName: true,
          sellerShopName: true,
          sellerBio: true,
          sellerLogoUrl: true,
          sellerCity: true,
          _count: { select: { products: true } },
        },
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
      // Store lookup is an optional part of global search. Never let a seller-schema
      // mismatch prevent the product search from returning real results.
      console.warn('[api/search] store lookup unavailable; returning product results only', error);
    }

    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "SearchQueryStat" ("id","query","resultCount","searchCount","lastSearchedAt") VALUES ($1,$2,$3,1,NOW()) ON CONFLICT ("query") DO UPDATE SET "resultCount"=$3,"searchCount"="SearchQueryStat"."searchCount"+1,"lastSearchedAt"=NOW()`,
        randomUUID(),
        q.toLowerCase(),
        result.total,
      );
    } catch {
      // Analytics persistence must never break search.
    }

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
        stores: storeResults,
        storeCount: storeResults.length,
      },
    });
  } catch (err) {
    console.error('[api/search]', err);
    return jsonError('internal_error', 'Search failed', { status: 500 });
  }
}
