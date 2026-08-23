/**
 * Product Repository
 *
 * Abstracts all database access for Product entities.
 * API routes and services depend only on IProductRepository,
 * never on Prisma directly.
 */

import { Prisma, type PrismaClient } from '@prisma/client';
import type { PaginatedResult } from './base.repository';
import { toPaginated } from './base.repository';
import { buildProductOrderBy } from '../algorithms/product-ranking';
import { buildSearchWhereClause } from '../algorithms/search-scoring';

function jsonValue(raw: string | null | undefined): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (raw == null || raw.trim() === '') return Prisma.JsonNull;
  let parsed: unknown;
  try { parsed = JSON.parse(raw) as unknown; } catch { throw new Error('Invalid JSON product field'); }
  const normalize = (value: unknown): Prisma.InputJsonValue => {
    if (typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number') { if (!Number.isFinite(value)) throw new Error('Invalid non-finite JSON number'); return value; }
    if (Array.isArray(value)) return value.map(normalize) as Prisma.InputJsonArray;
    if (value !== null && typeof value === 'object') {
      const object: Record<string, Prisma.InputJsonValue> = {};
      for (const [key, child] of Object.entries(value)) object[key] = normalize(child);
      return object;
    }
    throw new Error('Product JSON must contain only JSON-compatible values');
  };
  return normalize(parsed);
}

export interface ProductListFilter {
  q?: string; categoryKey?: string; categoryId?: string; sellerId?: string;
  priceMin?: number; priceMax?: number; inStock?: boolean; featured?: boolean;
  badge?: string; isActive?: boolean; isTraditional?: boolean; hasDiscount?: boolean;
  minRating?: number; sort?: string; page?: number; pageSize?: number;
}

export interface CreateProductInput {
  slug: string; name: string; shortDescription: string; price: number;
  compareAtPrice?: number | null; categoryId: string; sellerId: string; region: string;
  currency?: string; inStock?: boolean; isActive?: boolean; stockQuantity?: number;
  description?: string | null; whatsappNumber?: string | null; videoUrl?: string | null;
  isTraditional?: boolean; imagesJson?: string | null; featuresJson?: string | null;
  badge?: string | null; weightKg?: number | null; dimensionsJson?: string | null;
  tagsJson?: string | null; attributesJson?: string | null; primaryImageIndex?: number;
}

export interface UpdateProductInput {
  name?: string; shortDescription?: string; price?: number; compareAtPrice?: number | null;
  categoryId?: string; region?: string; currency?: string; inStock?: boolean; isActive?: boolean;
  stockQuantity?: number; description?: string | null; whatsappNumber?: string | null;
  videoUrl?: string | null; isTraditional?: boolean; imagesJson?: string | null;
  featuresJson?: string | null; badge?: string | null; weightKg?: number | null;
  dimensionsJson?: string | null; tagsJson?: string | null; attributesJson?: string | null;
  primaryImageIndex?: number;
}

const PRODUCT_LIST_INCLUDE = { category: true, seller: { select: { id: true, sellerShopName: true, sellerWhatsapp: true } } } satisfies Prisma.ProductInclude;
const PRODUCT_DETAIL_INCLUDE = { category: true, seller: { select: { id: true, sellerShopName: true, sellerWhatsapp: true, sellerBio: true, sellerLogoUrl: true } } } satisfies Prisma.ProductInclude;

export interface IProductRepository {
  findMany(filter: ProductListFilter): Promise<PaginatedResult<ProductRow>>;
  findSearchCandidates(where: Prisma.ProductWhereInput, take: number, skip: number): Promise<{ rows: ProductRow[]; total: number }>;
  findProductIdsWithMinRating(minRating: number): Promise<string[]>;
  findProductNames(query: string, limit: number): Promise<Array<{ name: string }>>;
  findBySlug(slug: string): Promise<ProductDetailRow | null>;
  findById(id: string): Promise<ProductDetailRow | null>;
  findByCategoryExcluding(categoryId: string, excludeId: string, limit: number): Promise<ProductRow[]>;
  findByIds(ids: string[]): Promise<ProductDetailRow[]>;
  findRelated(productId: string, limit: number): Promise<ProductRow[]>;
  create(input: CreateProductInput): Promise<ProductDetailRow>;
  update(id: string, input: UpdateProductInput): Promise<ProductDetailRow>;
  delete(id: string): Promise<void>;
  incrementViewCount(id: string): Promise<void>;
  getRatings(productIds: string[]): Promise<Map<string, { average: number; count: number }>>;
  countByCategory(categoryId: string): Promise<number>;
  countBySeller(sellerId: string): Promise<number>;
}

export type ProductRow = Prisma.ProductGetPayload<{ include: typeof PRODUCT_LIST_INCLUDE }>;
export type ProductDetailRow = Prisma.ProductGetPayload<{ include: typeof PRODUCT_DETAIL_INCLUDE }>;

export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(filter: ProductListFilter): Promise<PaginatedResult<ProductRow>> {
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filter.pageSize ?? 24));
    const where = await this.buildWhereClause(filter);
    const orderBy = buildProductOrderBy(filter.sort);
    const rows = await this.prisma.product.findMany({ where, include: PRODUCT_LIST_INCLUDE, orderBy, take: pageSize, skip: (page - 1) * pageSize });
    const total = await this.prisma.product.count({ where });
    return toPaginated(rows as unknown as ProductRow[], total, page, pageSize);
  }

  async findSearchCandidates(where: Prisma.ProductWhereInput, take: number, skip: number): Promise<{ rows: ProductRow[]; total: number }> {
    const rows = await this.prisma.product.findMany({ where, include: PRODUCT_LIST_INCLUDE, orderBy: [{ inStock: 'desc' }, { salesCount: 'desc' }, { createdAt: 'desc' }], take, skip });
    const total = await this.prisma.product.count({ where });
    return { rows: rows as unknown as ProductRow[], total };
  }

  async findProductIdsWithMinRating(minRating: number): Promise<string[]> {
    const rows = await this.prisma.review.groupBy({ by: ['productId'], where: { isApproved: true }, _avg: { rating: true }, having: { rating: { _avg: { gte: minRating } } } });
    return rows.map((row) => row.productId);
  }

  async findProductNames(query: string, limit: number): Promise<Array<{ name: string }>> {
    return this.prisma.product.findMany({ where: { isActive: true, name: { contains: query, mode: 'insensitive' } }, select: { name: true }, orderBy: { salesCount: 'desc' }, take: limit });
  }

  async findBySlug(slug: string): Promise<ProductDetailRow | null> {
    const row = await this.prisma.product.findFirst({ where: { slug, isActive: true }, include: PRODUCT_DETAIL_INCLUDE });
    return row as unknown as ProductDetailRow | null;
  }

  async findById(id: string): Promise<ProductDetailRow | null> {
    const row = await this.prisma.product.findUnique({ where: { id }, include: PRODUCT_DETAIL_INCLUDE });
    return row as unknown as ProductDetailRow | null;
  }

  async findByCategoryExcluding(categoryId: string, excludeId: string, limit: number): Promise<ProductRow[]> {
    const rows = await this.prisma.product.findMany({ where: { categoryId, id: { not: excludeId }, isActive: true }, include: PRODUCT_LIST_INCLUDE, orderBy: { salesCount: 'desc' }, take: limit });
    return rows as unknown as ProductRow[];
  }

  async findByIds(ids: string[]): Promise<ProductDetailRow[]> {
    if (ids.length === 0) return [];
    const rows = await this.prisma.product.findMany({ where: { id: { in: ids }, isActive: true }, include: PRODUCT_DETAIL_INCLUDE });
    return rows as unknown as ProductDetailRow[];
  }

  async findRelated(productId: string, limit: number): Promise<ProductRow[]> {
    const product = await this.prisma.product.findUnique({ where: { id: productId }, select: { categoryId: true } });
    if (!product) return [];
    return this.findByCategoryExcluding(product.categoryId, productId, limit);
  }

  async create(input: CreateProductInput): Promise<ProductDetailRow> {
    const row = await this.prisma.product.create({
      data: {
        slug: input.slug, name: input.name, shortDescription: input.shortDescription, price: input.price,
        compareAtPrice: input.compareAtPrice ?? null, categoryId: input.categoryId, sellerId: input.sellerId,
        region: input.region, currency: input.currency ?? 'AFN', inStock: input.inStock ?? true,
        isActive: input.isActive ?? true, stockQuantity: input.stockQuantity ?? 0,
        description: input.description ?? null, whatsappNumber: input.whatsappNumber ?? null,
        videoUrl: input.videoUrl ?? null, isTraditional: input.isTraditional ?? false,
        imagesJson: jsonValue(input.imagesJson), featuresJson: jsonValue(input.featuresJson),
        badge: input.badge ?? (input.compareAtPrice != null ? 'sale' : null), weightKg: input.weightKg ?? null,
        dimensionsJson: jsonValue(input.dimensionsJson), tagsJson: jsonValue(input.tagsJson),
        attributesJson: jsonValue(input.attributesJson), primaryImageIndex: input.primaryImageIndex ?? 0,
      },
      include: PRODUCT_DETAIL_INCLUDE,
    });
    return row as unknown as ProductDetailRow;
  }

  async update(id: string, input: UpdateProductInput): Promise<ProductDetailRow> {
    const data: Record<string, unknown> = { ...input };
    for (const field of ['imagesJson', 'featuresJson', 'dimensionsJson', 'tagsJson', 'attributesJson'] as const) if (field in input) data[field] = jsonValue(input[field]);
    if (input.compareAtPrice !== undefined) data.badge = input.compareAtPrice != null ? 'sale' : null;
    if (typeof input.stockQuantity === 'number' && input.inStock === undefined) data.inStock = input.stockQuantity > 0;
    const row = await this.prisma.product.update({ where: { id }, data: data as never, include: PRODUCT_DETAIL_INCLUDE });
    return row as unknown as ProductDetailRow;
  }

  async delete(id: string): Promise<void> { await this.prisma.product.delete({ where: { id } }); }
  async incrementViewCount(id: string): Promise<void> { await this.prisma.product.update({ where: { id }, data: { viewCount: { increment: 1 } }, select: { id: true } }); }

  async getRatings(productIds: string[]): Promise<Map<string, { average: number; count: number }>> {
    if (productIds.length === 0) return new Map();
    const rows = await this.prisma.review.groupBy({ by: ['productId'], where: { productId: { in: productIds }, isApproved: true }, _avg: { rating: true }, _count: { rating: true } });
    return new Map(rows.map((r) => [r.productId, { average: r._avg.rating ?? 0, count: r._count.rating }]));
  }

  async countByCategory(categoryId: string): Promise<number> { return this.prisma.product.count({ where: { categoryId, isActive: true } }); }
  async countBySeller(sellerId: string): Promise<number> { return this.prisma.product.count({ where: { sellerId } }); }

  private async buildWhereClause(filter: ProductListFilter): Promise<Prisma.ProductWhereInput> {
    const base: Prisma.ProductWhereInput = { isActive: filter.isActive !== false };
    if (filter.inStock !== undefined) base.inStock = filter.inStock;
    if (filter.isTraditional !== undefined) (base as Record<string, unknown>).isTraditional = filter.isTraditional;
    if (filter.categoryKey) base.category = { key: filter.categoryKey }; else if (filter.categoryId) base.categoryId = filter.categoryId;
    if (filter.sellerId) base.sellerId = filter.sellerId;
    if (filter.priceMin !== undefined || filter.priceMax !== undefined) base.price = { ...(filter.priceMin !== undefined ? { gte: filter.priceMin } : {}), ...(filter.priceMax !== undefined ? { lte: filter.priceMax } : {}) };
    if (filter.badge) base.badge = filter.badge;
    if (filter.hasDiscount) base.compareAtPrice = { not: null };
    if (filter.minRating !== undefined) {
      const ids = await this.findProductIdsWithMinRating(filter.minRating);
      base.id = { in: ids };
    }
    if (filter.featured) base.OR = [{ compareAtPrice: { not: null } }, { salesCount: { gt: 0 } }];
    if (filter.q) return { ...base, ...buildSearchWhereClause(filter.q) };
    return base;
  }
}
