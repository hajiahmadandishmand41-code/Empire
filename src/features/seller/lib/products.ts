/**
 * Seller product queries — Phase 11.4 + Phase 4 (Seller Marketplace).
 *
 * Server-only helpers. Reads from Prisma when `DATABASE_URL` is
 * configured, and falls back to the admin mock adapter otherwise.
 *
 * Phase 4 extends the row shape with `isActive`, `stockQuantity`,
 * `compareAtPrice` and the (parsed) image list so the seller UI can
 * manage inventory, discounts and product images.
 */
import { prisma, isDatabaseConfigured } from '@/lib/db';
import {
  mockProducts,
  mockCategories,
  type AdminProductRow,
  type AdminCategoryRow,
} from '@/features/admin/lib/mock-data';

export interface SellerProductRow extends AdminProductRow {
  isActive: boolean;
  stockQuantity: number;
  compareAtPrice: number | null;
  imageCount: number;
}

export type SellerCategoryRow = AdminCategoryRow;

export interface ListFilters {
  q?: string;
  page?: number;
  pageSize?: number;
  /** When set, restrict results to a single seller. Omit for admin views. */
  sellerId?: string;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  source: 'db' | 'mock';
}

function paginate<T>(
  items: T[],
  page = 1,
  pageSize = 10,
  source: 'db' | 'mock' = 'mock',
): Paged<T> {
  const total = items.length;
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total, page, pageSize, source };
}

function parseImages(raw: unknown): string[] {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    // Support two shapes: raw string URLs, or `{ src, alt }`.
    return parsed
      .map((v: unknown) =>
        typeof v === 'string' ? v : v && typeof v === 'object' && 'src' in v ? String((v as { src: unknown }).src ?? '') : '',
      )
      .filter((s: string) => s.length > 0);
  } catch {
    return [];
  }
}

function extendMockRow(row: AdminProductRow): SellerProductRow {
  return {
    ...row,
    isActive: row.inStock,
    stockQuantity: row.inStock ? 10 : 0,
    compareAtPrice: null,
    imageCount: 0,
  };
}

export async function listSellerProducts(f: ListFilters = {}): Promise<Paged<SellerProductRow>> {
  const page = f.page ?? 1;
  const pageSize = f.pageSize ?? 10;
  const q = f.q?.trim().toLowerCase() ?? '';

  if (!isDatabaseConfigured()) {
    if (f.sellerId) return paginate([], page, pageSize, 'mock');
    const filtered = q
      ? mockProducts.filter((p) => p.name.toLowerCase().includes(q))
      : mockProducts;
    return paginate(filtered.map(extendMockRow), page, pageSize, 'mock');
  }
  try {
    const textWhere = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { slug: { contains: q, mode: 'insensitive' as const } },
            { region: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const where = f.sellerId ? { AND: [{ sellerId: f.sellerId }, textWhere] } : textWhere;
    const [rows, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      prisma.product.count({ where }),
    ]);
    if (total === 0 && !q && !f.sellerId)
      return paginate(mockProducts.map(extendMockRow), page, pageSize, 'mock');
    const items: SellerProductRow[] = rows.map((p) => {
      const px = p as unknown as {
        isActive?: boolean;
        stockQuantity?: number;
        compareAtPrice?: number | null;
      };
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        price: Number(p.price),
        currency: p.currency,
        categoryName: p.category.name,
        region: p.region,
        inStock: p.inStock,
        createdAt: p.createdAt.toISOString(),
        isActive: px.isActive ?? true,
        stockQuantity: px.stockQuantity ?? 0,
        compareAtPrice: px.compareAtPrice == null ? null : Number(px.compareAtPrice),
        imageCount: parseImages(p.imagesJson).length,
      };
    });
    return { items, total, page, pageSize, source: 'db' };
  } catch (err) {
    console.error('[seller/products] database error:', err);
    throw err;
  }
}

export async function listSellerCategories(): Promise<{
  items: SellerCategoryRow[];
  source: 'db' | 'mock';
}> {
  if (!isDatabaseConfigured()) return { items: mockCategories, source: 'mock' };
  try {
    const rows = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
    if (rows.length === 0) return { items: mockCategories, source: 'mock' };
    return {
      items: rows.map((c) => ({
        id: c.id,
        key: c.key,
        name: c.name,
        slug: c.slug,
        productCount: c._count?.products ?? 0,
      })),
      source: 'db',
    };
  } catch (err) {
    console.error('[seller/categories] database error:', err);
    throw err;
  }
}

export interface SellerProductDetail {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string | null;
  price: number;
  currency: string;
  categoryId: string;
  region: string;
  inStock: boolean;
  isActive: boolean;
  stockQuantity: number;
  compareAtPrice: number | null;
  images: string[];
  sellerId: string | null;
  whatsappNumber: string | null;
  videoUrl: string | null;
  isTraditional: boolean;
}

export async function getSellerProduct(
  id: string,
  sellerId?: string,
): Promise<SellerProductDetail | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    const p = await prisma.product.findUnique({ where: { id } });
    if (!p) return null;
    if (sellerId && p.sellerId !== sellerId) return null;
    const px = p as unknown as {
      isActive?: boolean;
      stockQuantity?: number;
      compareAtPrice?: number | null;
      whatsappNumber?: string | null;
      videoUrl?: string | null;
      isTraditional?: boolean;
    };
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      shortDescription: p.shortDescription,
      description: p.description,
      price: Number(p.price),
      currency: p.currency,
      categoryId: p.categoryId,
      region: p.region,
      inStock: p.inStock,
      isActive: px.isActive ?? true,
      stockQuantity: px.stockQuantity ?? 0,
      compareAtPrice: px.compareAtPrice == null ? null : Number(px.compareAtPrice),
      images: parseImages(p.imagesJson),
      sellerId: p.sellerId,
      whatsappNumber: px.whatsappNumber ?? null,
      videoUrl: px.videoUrl ?? null,
      isTraditional: px.isTraditional ?? false,
    };
  } catch (err) {
    console.error('[seller/product.get]', err);
    return null;
  }
}
