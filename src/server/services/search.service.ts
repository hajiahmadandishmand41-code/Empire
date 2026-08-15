/**
 * Search Service — Professional Product Search Engine
 *
 * Provides a unified search interface over the product catalog.
 * Features:
 *   1. Live/instant search — fast DB query + in-memory re-ranking
 *   2. Autocomplete suggestions — names, categories, regions
 *   3. Fuzzy/typo-tolerant matching — using Levenshtein edit distance
 *   4. Multi-field search — name, description, category, tags, region
 *   5. Advanced filtering — price, stock, rating, discount, sort
 *   6. Extensible signal architecture — add new signals without refactoring
 *
 * Design principle: the DB does coarse filtering (ILIKE for broad recall),
 * then the in-memory scorer applies fine-grained ranking.
 * For datasets > 100k products, replace the DB layer with a search index
 * (Meilisearch, Typesense, or PostgreSQL FTS) without changing this interface.
 */

import type { IProductRepository } from '../repositories/product.repository';
import type { Prisma } from '@prisma/client';
import type { ICategoryRepository } from '../repositories/category.repository';
import { buildSearchWhereClause, computeSearchScore, generateSuggestions } from '../algorithms/search-scoring';
import { mapProductSummary } from '@/lib/db-mappers';
import type { ProductSummary } from '@/types';

export interface SearchOptions {
  q: string;
  categoryKey?: string;
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  minRating?: number;
  hasDiscount?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
  /** True for live/instant search (smaller result set, no pagination). */
  instant?: boolean;
}

export interface SearchResult {
  products: ProductSummary[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  /** Metadata for analytics and UI */
  meta: {
    query: string;
    durationMs: number;
    reranked: boolean;
  };
}

export interface SuggestionResult {
  suggestions: Array<{
    text: string;
    type: 'product' | 'category' | 'brand';
    score: number;
  }>;
  durationMs: number;
}

export class SearchService {
  constructor(
    private readonly products: IProductRepository,
    private readonly categories: ICategoryRepository,
  ) {}

  /**
   * Full search with optional filters, sorting, pagination, and re-ranking.
   *
   * Flow:
   *   1. Validate and normalize the query
   *   2. Build Prisma WHERE (coarse filtering via ILIKE)
   *   3. Fetch page of results from DB
   *   4. Re-rank in-memory using multi-field fuzzy scoring
   *   5. Attach batch ratings
   *   6. Return typed ProductSummary[]
   */
  async search(opts: SearchOptions): Promise<SearchResult> {
    const start = Date.now();

    const q = opts.q.trim();
    if (!q) {
      return {
        products: [],
        total: 0,
        page: 1,
        pageSize: opts.pageSize ?? 24,
        hasMore: false,
        meta: { query: q, durationMs: 0, reranked: false },
      };
    }

    const page = Math.max(1, opts.page ?? 1);
    // Instant search uses smaller result set for lower latency
    const pageSize = opts.instant ? 8 : Math.min(100, Math.max(1, opts.pageSize ?? 24));

    // For instant search, fetch more candidates to allow re-ranking
    const fetchSize = opts.instant ? 50 : pageSize * 3;

    // Build filters for DB query
    const searchWhere = buildSearchWhereClause(q);
    const ratedProductIds =
      opts.minRating != null
        ? await this.products.findProductIdsWithMinRating(opts.minRating)
        : undefined;
    const extraFilters = this.buildExtraFilters(opts, ratedProductIds);

    try {
      // Fetch from DB using coarse text search
      const where = {
        isActive: true,
        ...extraFilters,
        ...searchWhere,
      };

      const { rows, total } = await this.products.findSearchCandidates(
        where,
        fetchSize,
        opts.instant ? 0 : (page - 1) * pageSize,
      );

      // In-memory re-ranking for search relevance
      const scoredRows = rows
        .map((row) => ({
          row,
          score: computeSearchScore(
            {
              id: row.id,
              name: row.name,
              shortDescription: row.shortDescription,
              description: row.description,
              categoryName: (row as typeof row & { category: { name: string } }).category?.name,
              region: row.region,
              sellerShopName: (row as typeof row & { seller: { sellerShopName: string | null } | null }).seller?.sellerShopName,
            },
            q,
          ),
        }))
        .filter((x) => x.score > 0) // Exclude zero-score items (no fuzzy match)
        .sort((a, b) => b.score - a.score);

      const pageRows = opts.instant
        ? scoredRows.slice(0, pageSize)
        : scoredRows.slice(0, pageSize);

      // Fetch ratings in batch
      const productIds = pageRows.map((x) => x.row.id);
      const ratings = await this.products.getRatings(productIds);

      const summaries: ProductSummary[] = pageRows.map(({ row }) => {
        const rating = ratings.get(row.id);
        return mapProductSummary(row as never, {
          averageRating: rating?.average ?? 0,
          reviewCount: rating?.count ?? 0,
        });
      });

      return {
        products: summaries,
        total: scoredRows.length > 0 ? total : 0,
        page,
        pageSize,
        hasMore: (page - 1) * pageSize + summaries.length < total,
        meta: { query: q, durationMs: Date.now() - start, reranked: true },
      };
    } catch (err) {
      // A database failure must reach the API route and become a 5xx response.
      // Returning an empty successful result hides outages and makes clients
      // interpret infrastructure errors as a valid empty catalog.
      throw err;
    }
  }

  /**
   * Generate autocomplete suggestions for a partial query.
   * Optimized for low latency (< 100ms target).
   *
   * Sources:
   *   - Product names (most important)
   *   - Category names
   *   - Region names
   */
  async suggest(partialQuery: string, limit = 8): Promise<SuggestionResult> {
    const start = Date.now();
    const q = partialQuery.trim();

    if (!q || q.length < 2) {
      return { suggestions: [], durationMs: 0 };
    }

    try {
      // Fetch candidate data in parallel
      const [productNames, categoryNames] = await Promise.all([
        this.products.findProductNames(q, 30),
        this.categories.findAll(false),
      ]);

      const candidates = [
        ...productNames.map((p) => ({ text: p.name, type: 'product' as const })),
        ...categoryNames.map((c) => ({ text: c.name, type: 'category' as const })),
      ];

      const suggestions = generateSuggestions(candidates, q, limit);

      return { suggestions, durationMs: Date.now() - start };
    } catch (err) {
      // Do not turn a database outage into a misleading empty suggestion list.
      throw err;
    }
  }

  /**
   * Build extra Prisma WHERE filters from search options
   * (price range, stock, discount).
   */
  private buildExtraFilters(
    opts: SearchOptions,
    ratedProductIds?: string[],
  ): Prisma.ProductWhereInput {
    const filters: Prisma.ProductWhereInput = {};

    if (opts.categoryKey) {
      filters.category = { key: opts.categoryKey };
    }

    if (opts.inStock !== undefined) {
      filters.inStock = opts.inStock;
    }

    if (opts.hasDiscount) {
      filters.compareAtPrice = { not: null };
    }

    if (ratedProductIds) {
      filters.id = { in: ratedProductIds };
    }

    if (opts.priceMin !== undefined || opts.priceMax !== undefined) {
      filters.price = {
        ...(opts.priceMin !== undefined ? { gte: opts.priceMin } : {}),
        ...(opts.priceMax !== undefined ? { lte: opts.priceMax } : {}),
      };
    }

    return filters;
  }
}
