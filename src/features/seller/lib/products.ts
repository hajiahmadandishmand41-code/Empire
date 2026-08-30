/** Seller product queries — server-only, database-authoritative. */
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { parseProductImages } from '@/features/products/product-contract';

export interface SellerProductRow {
  id: string; slug: string; name: string; price: number; currency: string; categoryName: string;
  region: string; inStock: boolean; createdAt: string; isActive: boolean; stockQuantity: number;
  compareAtPrice: number | null; imageCount: number;
}
export interface SellerCategoryRow { id: string; key: string; name: string; slug: string; productCount: number; }
export interface ListFilters { q?: string; page?: number; pageSize?: number; sellerId?: string; }
export interface Paged<T> { items: T[]; total: number; page: number; pageSize: number; source: 'db' | 'empty' | 'unavailable'; }

export async function listSellerProducts(f: ListFilters = {}): Promise<Paged<SellerProductRow>> {
  const page = Math.max(1, f.page ?? 1);
  const pageSize = Math.min(50, Math.max(5, f.pageSize ?? 20));
  const q = f.q?.trim() ?? '';
  if (!isDatabaseConfigured()) return { items: [], total: 0, page, pageSize, source: 'unavailable' };
  const textWhere = q ? { OR: [
    { name: { contains: q, mode: 'insensitive' as const } },
    { slug: { contains: q, mode: 'insensitive' as const } },
    { region: { contains: q, mode: 'insensitive' as const } },
  ] } : {};
  const where = f.sellerId ? { AND: [{ sellerId: f.sellerId }, textWhere] } : textWhere;
  const [rows, total] = await Promise.all([
    prisma.product.findMany({ where, select: { id: true, slug: true, name: true, price: true, currency: true, region: true, inStock: true, isActive: true, stockQuantity: true, compareAtPrice: true, imagesJson: true, createdAt: true, category: { select: { name: true } } }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: pageSize, skip: (page - 1) * pageSize }),
    prisma.product.count({ where }),
  ]);
  const items: SellerProductRow[] = rows.map((p) => ({ id: p.id, slug: p.slug, name: p.name, price: Number(p.price), currency: p.currency, categoryName: p.category.name, region: p.region, inStock: p.inStock, createdAt: p.createdAt.toISOString(), isActive: p.isActive, stockQuantity: p.stockQuantity, compareAtPrice: p.compareAtPrice == null ? null : Number(p.compareAtPrice), imageCount: parseProductImages(p.imagesJson).length }));
  return { items, total, page, pageSize, source: total === 0 ? 'empty' : 'db' };
}

export async function listSellerCategories(): Promise<{ items: SellerCategoryRow[]; source: 'db' | 'empty' | 'unavailable' }> {
  if (!isDatabaseConfigured()) return { items: [], source: 'unavailable' };
  const rows = await prisma.category.findMany({ include: { _count: { select: { products: true } } }, orderBy: { name: 'asc' } });
  return { items: rows.map((c) => ({ id: c.id, key: c.key, name: c.name, slug: c.slug, productCount: c._count?.products ?? 0 })), source: rows.length === 0 ? 'empty' : 'db' };
}

export interface SellerProductDetail { id: string; slug: string; name: string; shortDescription: string; description: string | null; price: number; currency: string; categoryId: string; region: string; inStock: boolean; isActive: boolean; stockQuantity: number; compareAtPrice: number | null; images: string[]; sellerId: string | null; whatsappNumber: string | null; videoUrl: string | null; isTraditional: boolean; }

export async function getSellerProduct(id: string, sellerId?: string): Promise<SellerProductDetail | null> {
  if (!isDatabaseConfigured()) return null;
  const p = await prisma.product.findUnique({ where: { id } });
  if (!p || (sellerId && p.sellerId !== sellerId)) return null;
  return { id: p.id, slug: p.slug, name: p.name, shortDescription: p.shortDescription, description: p.description, price: Number(p.price), currency: p.currency, categoryId: p.categoryId, region: p.region, inStock: p.inStock, isActive: p.isActive, stockQuantity: p.stockQuantity, compareAtPrice: p.compareAtPrice == null ? null : Number(p.compareAtPrice), images: parseProductImages(p.imagesJson), sellerId: p.sellerId, whatsappNumber: p.whatsappNumber ?? null, videoUrl: p.videoUrl ?? null, isTraditional: p.isTraditional };
}
