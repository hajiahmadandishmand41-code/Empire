/** Database-backed marketplace search with bounded candidate ranking. */

import type { Prisma } from '@prisma/client';
import type { IProductRepository, ProductRow } from '../repositories/product.repository';
import type { ICategoryRepository } from '../repositories/category.repository';
import { buildSearchWhereClause, computeSearchScore, generateSuggestions } from '../algorithms/search-scoring';
import { mapProductSummary } from '@/lib/db-mappers';
import type { ProductSummary } from '@/types';

export type SearchSort = 'relevance' | 'bestSelling' | 'popular' | 'newest' | 'priceAsc' | 'priceDesc' | 'rating';

export interface SearchOptions {
  q: string;
  categoryKey?: string;
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  minRating?: number;
  hasDiscount?: boolean;
  sellerId?: string;
  brand?: string;
  sort?: SearchSort | string;
  page?: number;
  pageSize?: number;
  instant?: boolean;
}

export interface SearchFacetOption { value: string; label: string; count: number }
export interface SearchFacets {
  categories: SearchFacetOption[];
  sellers: Array<SearchFacetOption & { id: string }>;
  brands: SearchFacetOption[];
  price: { min: number; max: number } | null;
}

export interface SearchResult {
  products: ProductSummary[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  meta: { query: string; durationMs: number; reranked: boolean; facets: SearchFacets };
}

export interface SuggestionResult {
  suggestions: Array<{ text: string; type: 'product' | 'category' | 'brand'; score: number }>;
  durationMs: number;
}

const MAX_CANDIDATES = 240;

function readBrand(attributesJson: unknown): string | null {
  if (!attributesJson) return null;
  let value: unknown = attributesJson;
  if (typeof value === 'string') {
    try { value = JSON.parse(value) as unknown; } catch { return null; }
  }
  if (Array.isArray(value)) {
    const item = value.find((entry) => {
      if (!entry || typeof entry !== 'object') return false;
      const record = entry as Record<string, unknown>;
      const key = String(record.key ?? record.name ?? '').trim().toLowerCase();
      return key === 'brand' || key === 'برند';
    }) as Record<string, unknown> | undefined;
    return item ? String(item.value ?? item.label ?? '').trim() || null : null;
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const key = Object.keys(record).find((candidate) => ['brand', 'برند'].includes(candidate.trim().toLowerCase()));
    return key ? String(record[key] ?? '').trim() || null : null;
  }
  return null;
}

function hasBrand(row: ProductRow, brand: string): boolean {
  const wanted = brand.trim().toLocaleLowerCase();
  const actual = readBrand(row.attributesJson);
  return Boolean(actual && actual.toLocaleLowerCase() === wanted);
}

function compareForSort(a: ProductRow, b: ProductRow, sort: SearchSort, ratingMap: Map<string, { average: number; count: number }>): number {
  if (sort === 'priceAsc') return Number(a.price) - Number(b.price) || b.createdAt.getTime() - a.createdAt.getTime();
  if (sort === 'priceDesc') return Number(b.price) - Number(a.price) || b.createdAt.getTime() - a.createdAt.getTime();
  if (sort === 'newest') return b.createdAt.getTime() - a.createdAt.getTime() || b.salesCount - a.salesCount;
  if (sort === 'bestSelling') return b.salesCount - a.salesCount || b.viewCount - a.viewCount;
  if (sort === 'popular') return b.salesCount + b.viewCount * 0.2 - (a.salesCount + a.viewCount * 0.2) || b.createdAt.getTime() - a.createdAt.getTime();
  if (sort === 'rating') {
    const ar = ratingMap.get(a.id)?.average ?? 0;
    const br = ratingMap.get(b.id)?.average ?? 0;
    return br - ar || (ratingMap.get(b.id)?.count ?? 0) - (ratingMap.get(a.id)?.count ?? 0);
  }
  return 0;
}

function buildFacets(rows: ProductRow[]): SearchFacets {
  const categoryMap = new Map<string, { label: string; count: number }>();
  const sellerMap = new Map<string, { label: string; count: number }>();
  const brandMap = new Map<string, { label: string; count: number }>();
  let min = Number.POSITIVE_INFINITY;
  let max = 0;

  for (const row of rows) {
    const category = row.category;
    categoryMap.set(category.key, { label: category.name, count: (categoryMap.get(category.key)?.count ?? 0) + 1 });
    if (row.seller?.id) sellerMap.set(row.seller.id, { label: row.seller.sellerShopName ?? 'Eshop Seller', count: (sellerMap.get(row.seller.id)?.count ?? 0) + 1 });
    const brand = readBrand(row.attributesJson);
    if (brand) brandMap.set(brand, { label: brand, count: (brandMap.get(brand)?.count ?? 0) + 1 });
    const price = Number(row.price);
    if (Number.isFinite(price)) { min = Math.min(min, price); max = Math.max(max, price); }
  }

  return {
    categories: [...categoryMap.entries()].sort((a, b) => b[1].count - a[1].count).map(([value, meta]) => ({ value, ...meta })),
    sellers: [...sellerMap.entries()].sort((a, b) => b[1].count - a[1].count).map(([id, meta]) => ({ id, value: id, ...meta })),
    brands: [...brandMap.entries()].sort((a, b) => b[1].count - a[1].count).map(([value, meta]) => ({ value, ...meta })),
    price: Number.isFinite(min) ? { min, max } : null,
  };
}

export class SearchService {
  constructor(
    private readonly products: IProductRepository,
    private readonly categories: ICategoryRepository,
  ) {}

  async search(opts: SearchOptions): Promise<SearchResult> {
    const start = Date.now();
    const q = opts.q.trim();
    const page = Math.max(1, opts.page ?? 1);
    const pageSize = opts.instant ? 8 : Math.min(48, Math.max(1, opts.pageSize ?? 24));
    const sort = (opts.sort ?? 'relevance') as SearchSort;

    const ratedProductIds = opts.minRating != null
      ? await this.products.findProductIdsWithMinRating(opts.minRating)
      : undefined;
    const extraFilters = this.buildExtraFilters(opts, ratedProductIds);

    if (!q) {
      const result = await this.products.findMany({
        ...this.toListFilter(opts),
        sort: sort === 'relevance' ? 'popular' : sort,
        page,
        pageSize,
        isActive: true,
      });
      const ratings = await this.products.getRatings(result.items.map((row) => row.id));
      const products = result.items.map((row) => mapProductSummary(row as never, { averageRating: ratings.get(row.id)?.average ?? 0, reviewCount: ratings.get(row.id)?.count ?? 0 }));
      return {
        products,
        total: result.total,
        page,
        pageSize,
        hasMore: result.hasMore,
        meta: { query: '', durationMs: Date.now() - start, reranked: false, facets: buildFacets(result.items) },
      };
    }

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...extraFilters,
      ...buildSearchWhereClause(q),
    };

    // Relevance ranking is intentionally bounded to protect the request from
    // loading an unbounded product catalogue into Node. The DB recall query
    // remains the source of truth; non-relevance sorts use the same candidates.
    const { rows, total: coarseTotal } = await this.products.findSearchCandidates(where, MAX_CANDIDATES, 0);
    const brandFiltered = opts.brand ? rows.filter((row) => hasBrand(row, opts.brand!)) : rows;
    const productIds = brandFiltered.map((row) => row.id);
    const ratings = await this.products.getRatings(productIds);

    let rankedRows: ProductRow[];
    if (sort === 'relevance') {
      rankedRows = brandFiltered
        .map((row) => ({
          row,
          score: computeSearchScore({
            id: row.id,
            name: row.name,
            shortDescription: row.shortDescription,
            description: row.description,
            categoryName: row.category?.name,
            tags: Array.isArray(row.tagsJson) ? row.tagsJson.filter((value): value is string => typeof value === 'string') : undefined,
            region: row.region,
            sellerShopName: row.seller?.sellerShopName,
            brand: readBrand(row.attributesJson),
          }, q),
        }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score || b.row.salesCount - a.row.salesCount)
        .map((entry) => entry.row);
    } else {
      rankedRows = [...brandFiltered].sort((a, b) => compareForSort(a, b, sort, ratings));
    }

    const startIndex = (page - 1) * pageSize;
    const pageRows = rankedRows.slice(startIndex, startIndex + pageSize);
    const products = pageRows.map((row) => mapProductSummary(row as never, { averageRating: ratings.get(row.id)?.average ?? 0, reviewCount: ratings.get(row.id)?.count ?? 0 }));
    const total = opts.brand ? rankedRows.length : (rankedRows.length > 0 ? coarseTotal : 0);

    return {
      products,
      total,
      page,
      pageSize,
      hasMore: startIndex + pageRows.length < total && startIndex + pageRows.length < MAX_CANDIDATES,
      meta: { query: q, durationMs: Date.now() - start, reranked: sort === 'relevance', facets: buildFacets(brandFiltered) },
    };
  }

  async suggest(partialQuery: string, limit = 8): Promise<SuggestionResult> {
    const start = Date.now();
    const q = partialQuery.trim();
    if (!q || q.length < 2) return { suggestions: [], durationMs: 0 };
    const [productNames, categoryNames] = await Promise.all([
      this.products.findProductNames(q, 30),
      this.categories.findAll(false),
    ]);
    const candidates = [
      ...productNames.map((p) => ({ text: p.name, type: 'product' as const })),
      ...categoryNames.map((c) => ({ text: c.name, type: 'category' as const })),
    ];
    return { suggestions: generateSuggestions(candidates, q, limit), durationMs: Date.now() - start };
  }

  private toListFilter(opts: SearchOptions) {
    return {
      categoryKey: opts.categoryKey,
      priceMin: opts.priceMin,
      priceMax: opts.priceMax,
      inStock: opts.inStock,
      sellerId: opts.sellerId,
      hasDiscount: opts.hasDiscount,
    };
  }

  private buildExtraFilters(opts: SearchOptions, ratedProductIds?: string[]): Prisma.ProductWhereInput {
    const filters: Prisma.ProductWhereInput = {};
    if (opts.categoryKey) filters.category = { key: opts.categoryKey };
    if (opts.inStock !== undefined) filters.inStock = opts.inStock;
    if (opts.sellerId) filters.sellerId = opts.sellerId;
    if (opts.hasDiscount) filters.compareAtPrice = { not: null };
    if (ratedProductIds) filters.id = { in: ratedProductIds };
    if (opts.priceMin !== undefined || opts.priceMax !== undefined) {
      filters.price = {
        ...(opts.priceMin !== undefined ? { gte: opts.priceMin } : {}),
        ...(opts.priceMax !== undefined ? { lte: opts.priceMax } : {}),
      };
    }
    return filters;
  }
}
