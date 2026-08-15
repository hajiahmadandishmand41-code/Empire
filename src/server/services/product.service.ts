/**
 * Product Service — Business Logic Layer
 *
 * Orchestrates product use cases. All business rules live here:
 *   - Category required validation before create/update
 *   - Visibility rules (only real seller products shown on homepage)
 *   - Post-create side effects (auto-visible on homepage/category/seller pages)
 *   - In-memory re-ranking after DB fetch for search quality
 *   - View count increment on product detail fetch
 *
 * Services depend on IProductRepository, not Prisma directly.
 * This makes swapping the data source trivial and enables unit testing
 * by injecting a mock repository.
 */

import type { IProductRepository, ProductListFilter, ProductRow } from '../repositories/product.repository';
import type { ICategoryRepository } from '../repositories/category.repository';
import type { IReviewRepository } from '../repositories/review.repository';
import { mapProductSummary, mapProduct } from '@/lib/db-mappers';
import { computeSearchScore } from '../algorithms/search-scoring';
import { rankProducts, DEFAULT_RANKING_CONFIG } from '../algorithms/product-ranking';
import type { Product, ProductSummary } from '@/types';
import type { PaginatedResult } from '../repositories/base.repository';

export interface ProductListOptions extends ProductListFilter {
  /** If true, apply in-memory relevance re-ranking (used for search results). */
  rerank?: boolean;
}

export interface ProductListResult {
  products: ProductSummary[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  source: 'db';
}

/** Domain-level errors raised by the service. */
export class ProductServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly httpStatus = 400,
  ) {
    super(message);
    this.name = 'ProductServiceError';
  }
}

export class ProductService {
  constructor(
    private readonly products: IProductRepository,
    private readonly categories: ICategoryRepository,
    private readonly reviews: IReviewRepository,
  ) {}

  /**
   * List products for public pages (homepage, shop listing, category pages).
   *
   * Only real, active products registered by sellers are returned.
   * No demo/seed data is ever surfaced through this path.
   *
   * The ordering is determined by the `sort` parameter using the
   * product ranking algorithm. If `q` is provided, results are
   * additionally re-ranked in-memory by search relevance.
   */
  async listProducts(opts: ProductListOptions): Promise<ProductListResult> {
    const page = Math.max(1, opts.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 24));

    // For the default relevance feed, fetch a bounded candidate pool and rank it
    // with multiple quality signals. This avoids letting one raw DB counter
    // (e.g. salesCount) monopolize the first screen forever. Explicit sorts
    // keep their deterministic database ordering.
    const useSmartFeed = !opts.q && (!opts.sort || opts.sort === 'default' || opts.sort === 'recommended');
    const candidatePageSize = useSmartFeed && page === 1 ? Math.min(72, pageSize * 3) : pageSize;
    const paginated = await this.products.findMany({
      ...opts,
      page,
      pageSize: candidatePageSize,
      isActive: true, // ALWAYS filter to active-only on public pages
    });

    // Fetch batch ratings in a single query for the candidate page
    const ids = paginated.items.map((r) => r.id);
    const ratings = await this.products.getRatings(ids);

    // Convert DB rows → domain ProductSummary objects
    let summaries: ProductSummary[] = paginated.items.map((row) => {
      const rating = ratings.get(row.id);
      return mapProductSummary(row as never, {
        averageRating: rating?.average ?? 0,
        reviewCount: rating?.count ?? 0,
      });
    });

    // Search re-ranking: combine textual relevance with product quality.
    // For the normal feed, use the same multi-signal ranking engine without
    // allowing a single signal to dominate the catalog.
    if (opts.q && opts.rerank !== false) {
      const scored = summaries
        .map((s) => ({
          product: s,
          score: computeSearchScore(
            {
              id: s.id,
              name: s.name,
              shortDescription: s.shortDescription,
              categoryName: s.categoryKey,
            },
            opts.q!,
          ),
        }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score);
      summaries = scored.map((x) => x.product);
    } else if (useSmartFeed && page === 1) {
      summaries = rankProducts(
        summaries.map((s) => ({
          ...s,
          averageRating: s.averageRating ?? 0,
          reviewCount: s.reviewCount ?? 0,
          salesCount: s.salesCount ?? 0,
          viewCount: s.viewCount ?? 0,
          compareAtPrice: s.comparePrice ?? null,
          createdAt: s.createdAt ?? null,
        })),
        DEFAULT_RANKING_CONFIG,
      ).slice(0, pageSize);
    }

    return {
      products: summaries,
      total: paginated.total,
      page: paginated.page,
      pageSize,
      hasMore: page === 1 && useSmartFeed
        ? paginated.total > pageSize
        : paginated.hasMore,
      source: 'db',
    };
  }

  /**
   * Get a single product by slug for the product detail page.
   * Increments the view count atomically.
   * Returns null if not found or not active.
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    const row = await this.products.findBySlug(slug);
    if (!row) return null;

    // Increment view count asynchronously (fire-and-forget, non-blocking)
    void this.products.incrementViewCount(row.id).catch(() => {
      // Swallow errors — view count failure should never break product page load
    });

    const agg = await this.reviews.summarize(row.id);

    return mapProduct(row as never, {
      averageRating: agg.average,
      reviewCount: agg.count,
    });
  }

  /**
   * Get related products for the product detail page.
   * Prioritizes same-category products, then fills with top products.
   */
  async getRelatedProducts(slug: string, limit = 4): Promise<ProductSummary[]> {
    const product = await this.products.findBySlug(slug);
    if (!product) return [];

    const related = await this.products.findRelated(product.id, limit);
    return related.map((r) => mapProductSummary(r as never));
  }

  /**
   * Create a new product for a seller.
   *
   * Business rules:
   *   - Category MUST exist (validated here, not in the route handler)
   *   - Product is immediately visible on homepage/category/seller pages
   *     after creation (isActive defaults to true)
   *   - badge auto-set to 'sale' when compareAtPrice is provided
   *   - slug uniqueness enforced at DB level (P2002 → clean error)
   */
  async createProduct(input: {
    slug: string;
    name: string;
    shortDescription: string;
    price: number;
    compareAtPrice?: number | null;
    categoryId: string;
    sellerId: string;
    region: string;
    currency?: string;
    inStock?: boolean;
    isActive?: boolean;
    stockQuantity?: number;
    description?: string | null;
    whatsappNumber?: string | null;
    videoUrl?: string | null;
    isTraditional?: boolean;
    weightKg?: number | null;
    dimensionsJson?: string | null;
    tagsJson?: string | null;
    attributesJson?: string | null;
    primaryImageIndex?: number;
  }) {
    // Enforce category selection — no product may exist without a category
    const category = await this.categories.findById(input.categoryId);
    if (!category) {
      throw new ProductServiceError(
        'category_not_found',
        'دسته‌بندی انتخاب‌شده وجود ندارد. لطفاً یک دسته‌بندی معتبر انتخاب کنید.',
        422,
      );
    }

    try {
      return await this.products.create(input);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === 'P2002') {
        throw new ProductServiceError(
          'slug_exists',
          'محصولی با این شناسه (slug) قبلاً ثبت شده است. لطفاً شناسه دیگری انتخاب کنید.',
          409,
        );
      }
      throw err;
    }
  }

  /**
   * Update a product. Validates category if provided.
   * Syncs inStock/badge automatically when stock changes.
   */
  async updateProduct(
    id: string,
    input: {
      name?: string;
      shortDescription?: string;
      price?: number;
      compareAtPrice?: number | null;
      categoryId?: string;
      region?: string;
      currency?: string;
      inStock?: boolean;
      isActive?: boolean;
      stockQuantity?: number;
      description?: string | null;
      whatsappNumber?: string | null;
      videoUrl?: string | null;
      isTraditional?: boolean;
      weightKg?: number | null;
      dimensionsJson?: string | null;
      tagsJson?: string | null;
      attributesJson?: string | null;
      primaryImageIndex?: number;
    },
  ) {
    // If categoryId is being changed, validate the new category exists
    if (input.categoryId) {
      const category = await this.categories.findById(input.categoryId);
      if (!category) {
        throw new ProductServiceError(
          'category_not_found',
          'دسته‌بندی انتخاب‌شده وجود ندارد.',
          422,
        );
      }
    }

    return this.products.update(id, input);
  }

  /**
   * Delete a product. The caller must verify ownership before calling.
   */
  async deleteProduct(id: string): Promise<void> {
    await this.products.delete(id);
  }

  /**
   * Verify that a user owns a product (or is admin).
   * Returns 'ok', 'not_found', or 'forbidden'.
   */
  async checkOwnership(
    productId: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<'ok' | 'not_found' | 'forbidden'> {
    const product = await this.products.findById(productId);
    if (!product) return 'not_found';
    if (isAdmin) return 'ok';
    if (product.sellerId !== userId) return 'forbidden';
    return 'ok';
  }

  /**
   * Homepage sections: returns products for each display section.
   * Each section uses a different ranking signal.
   * All sections only show real seller products (isActive=true).
   */
  async getHomepageSections(sectionSize = 8): Promise<{
    newest: ProductSummary[];
    bestSelling: ProductSummary[];
    mostViewed: ProductSummary[];
    popular: ProductSummary[];
    featured: ProductSummary[];
  }> {
    const baseFilter: ProductListFilter = { isActive: true, pageSize: sectionSize };

    // Fetch all sections in parallel for maximum performance
    const [newResult, bestResult, viewedResult, popularResult, featuredResult] =
      await Promise.all([
        this.products.findMany({ ...baseFilter, sort: 'newest', page: 1 }),
        this.products.findMany({ ...baseFilter, sort: 'bestSelling', page: 1 }),
        this.products.findMany({ ...baseFilter, sort: 'mostViewed', page: 1 }),
        this.products.findMany({ ...baseFilter, sort: 'popular', page: 1 }),
        this.products.findMany({ ...baseFilter, featured: true, sort: 'featured', page: 1 }),
      ]);

    // Get ratings for all unique product IDs at once
    const allIds = [
      ...newResult.items,
      ...bestResult.items,
      ...viewedResult.items,
      ...popularResult.items,
      ...featuredResult.items,
    ].map((r) => r.id);
    const uniqueIds = [...new Set(allIds)];
    const ratings = await this.products.getRatings(uniqueIds);

    const toSummaries = (rows: ProductRow[]): ProductSummary[] =>
      rows.map((row) => {
        const rating = ratings.get(row.id);
        return mapProductSummary(row as never, {
          averageRating: rating?.average ?? 0,
          reviewCount: rating?.count ?? 0,
        });
      });

    return {
      newest: toSummaries(newResult.items),
      bestSelling: toSummaries(bestResult.items),
      mostViewed: toSummaries(viewedResult.items),
      popular: toSummaries(popularResult.items),
      featured: toSummaries(featuredResult.items),
    };
  }
}
