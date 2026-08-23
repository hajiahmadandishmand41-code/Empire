/**
 * Product Service — Business Logic Layer
 */

import type { IProductRepository, ProductListFilter, ProductRow } from '../repositories/product.repository';
import type { ICategoryRepository } from '../repositories/category.repository';
import type { IReviewRepository } from '../repositories/review.repository';
import { mapProductSummary, mapProduct } from '@/lib/db-mappers';
import { computeSearchScore } from '../algorithms/search-scoring';
import { rankProducts, DEFAULT_RANKING_CONFIG } from '../algorithms/product-ranking';
import type { Product, ProductSummary } from '@/types';

export interface ProductListOptions extends ProductListFilter { rerank?: boolean; }
export interface ProductListResult { products: ProductSummary[]; total: number; page: number; pageSize: number; hasMore: boolean; source: 'db'; }

export class ProductServiceError extends Error {
  constructor(public readonly code: string, message: string, public readonly httpStatus = 400) { super(message); this.name = 'ProductServiceError'; }
}

export class ProductService {
  constructor(private readonly products: IProductRepository, private readonly categories: ICategoryRepository, private readonly reviews: IReviewRepository) {}

  async listProducts(opts: ProductListOptions): Promise<ProductListResult> {
    const page = Math.max(1, opts.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 24));
    const useSmartFeed = !opts.q && (!opts.sort || opts.sort === 'default' || opts.sort === 'recommended');
    const candidatePageSize = useSmartFeed && page === 1 ? Math.min(72, pageSize * 3) : pageSize;
    const paginated = await this.products.findMany({ ...opts, page, pageSize: candidatePageSize, isActive: true });
    const ids = paginated.items.map((r) => r.id);
    const ratings = await this.products.getRatings(ids);
    let summaries: ProductSummary[] = paginated.items.map((row) => { const rating = ratings.get(row.id); return mapProductSummary(row as never, { averageRating: rating?.average ?? 0, reviewCount: rating?.count ?? 0 }); });
    if (opts.q && opts.rerank !== false) {
      summaries = summaries
        .map((s) => ({ product: s, score: computeSearchScore({ id: s.id, name: s.name, shortDescription: s.shortDescription, categoryName: s.categoryKey }, opts.q!) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((x) => x.product);
    } else if (useSmartFeed && page === 1) {
      summaries = rankProducts(summaries.map((s) => ({ ...s, averageRating: s.averageRating ?? 0, reviewCount: s.reviewCount ?? 0, salesCount: s.salesCount ?? 0, viewCount: s.viewCount ?? 0, compareAtPrice: s.comparePrice ?? null, createdAt: s.createdAt ?? undefined })), DEFAULT_RANKING_CONFIG).slice(0, pageSize);
    }
    return { products: summaries, total: paginated.total, page: paginated.page, pageSize, hasMore: page === 1 && useSmartFeed ? paginated.total > pageSize : paginated.hasMore, source: 'db' };
  }

  async getProductBySlug(slug: string): Promise<Product | null> { const row = await this.products.findBySlug(slug); if (!row) return null; void this.products.incrementViewCount(row.id).catch(() => undefined); const agg = await this.reviews.summarize(row.id); return mapProduct(row as never, { averageRating: agg.average, reviewCount: agg.count }); }
  async getProductById(id: string): Promise<Product | null> { const row = await this.products.findById(id); if (!row) return null; void this.products.incrementViewCount(row.id).catch(() => undefined); const agg = await this.reviews.summarize(row.id); return mapProduct(row as never, { averageRating: agg.average, reviewCount: agg.count }); }
  async getRelatedProducts(slug: string, limit = 4): Promise<ProductSummary[]> { const product = await this.products.findBySlug(slug); if (!product) return []; const related = await this.products.findRelated(product.id, limit); return related.map((r) => mapProductSummary(r as never)); }

  async createProduct(input: { slug: string; name: string; shortDescription: string; price: number; compareAtPrice?: number | null; categoryId: string; sellerId: string; region: string; currency?: string; inStock?: boolean; isActive?: boolean; stockQuantity?: number; description?: string | null; whatsappNumber?: string | null; videoUrl?: string | null; isTraditional?: boolean; imagesJson?: string | null; weightKg?: number | null; dimensionsJson?: string | null; tagsJson?: string | null; attributesJson?: string | null; primaryImageIndex?: number; }) {
    const category = await this.categories.findById(input.categoryId);
    if (!category) throw new ProductServiceError('category_not_found', 'دسته‌بندی انتخاب‌شده وجود ندارد. لطفاً یک دسته‌بندی معتبر انتخاب کنید.', 422);
    try { return await this.products.create(input); } catch (err: unknown) { const e = err as { code?: string }; if (e.code === 'P2002') throw new ProductServiceError('slug_exists', 'محصولی با این شناسه (slug) قبلاً ثبت شده است. لطفاً شناسه دیگری انتخاب کنید.', 409); throw err; }
  }

  async updateProduct(id: string, input: { name?: string; shortDescription?: string; price?: number; compareAtPrice?: number | null; categoryId?: string; region?: string; currency?: string; inStock?: boolean; isActive?: boolean; stockQuantity?: number; description?: string | null; whatsappNumber?: string | null; videoUrl?: string | null; isTraditional?: boolean; imagesJson?: string | null; weightKg?: number | null; dimensionsJson?: string | null; tagsJson?: string | null; attributesJson?: string | null; primaryImageIndex?: number; }) {
    if (input.categoryId) { const category = await this.categories.findById(input.categoryId); if (!category) throw new ProductServiceError('category_not_found', 'دسته‌بندی انتخاب‌شده وجود ندارد.', 422); }
    return this.products.update(id, input);
  }
  async deleteProduct(id: string): Promise<void> { await this.products.delete(id); }
  async checkOwnership(productId: string, userId: string, isAdmin: boolean): Promise<'ok' | 'not_found' | 'forbidden'> { const product = await this.products.findById(productId); if (!product) return 'not_found'; if (isAdmin) return 'ok'; return product.sellerId === userId ? 'ok' : 'forbidden'; }

  async getHomepageSections(sectionSize = 8): Promise<{ newest: ProductSummary[]; bestSelling: ProductSummary[]; mostViewed: ProductSummary[]; popular: ProductSummary[]; featured: ProductSummary[]; }> {
    const baseFilter: ProductListFilter = { isActive: true, pageSize: sectionSize };
    // Query catalog sections sequentially: the home page is rendered through
    // serverless functions where excessive parallel Prisma queries can exhaust
    // the connection pool even though each query is individually lightweight.
    const newResult = await this.products.findMany({ ...baseFilter, sort: 'newest', page: 1 });
    const bestResult = await this.products.findMany({ ...baseFilter, sort: 'bestSelling', page: 1 });
    const viewedResult = await this.products.findMany({ ...baseFilter, sort: 'mostViewed', page: 1 });
    const popularResult = await this.products.findMany({ ...baseFilter, sort: 'popular', page: 1 });
    const featuredResult = await this.products.findMany({ ...baseFilter, featured: true, sort: 'featured', page: 1 });
    const allIds = [...newResult.items, ...bestResult.items, ...viewedResult.items, ...popularResult.items, ...featuredResult.items].map((r) => r.id);
    const ratings = await this.products.getRatings([...new Set(allIds)]);
    const toSummaries = (rows: ProductRow[]): ProductSummary[] => rows.map((row) => { const rating = ratings.get(row.id); return mapProductSummary(row as never, { averageRating: rating?.average ?? 0, reviewCount: rating?.count ?? 0 }); });
    return { newest: toSummaries(newResult.items), bestSelling: toSummaries(bestResult.items), mostViewed: toSummaries(viewedResult.items), popular: toSummaries(popularResult.items), featured: toSummaries(featuredResult.items) };
  }
}
