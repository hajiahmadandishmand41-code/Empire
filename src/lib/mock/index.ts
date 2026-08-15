/**
 * Mock data adapter — Phase 6.
 *
 * Bridges the feature-level in-memory mocks (src/features/<name>/data)
 * to the domain contracts declared in `src/types`. This is the ONLY
 * place where the legacy mock shape (with React icons + gradient
 * accents) is normalised into a backend-compatible `Product`.
 *
 * Swapping the real backend on later only requires updating
 * src/lib/api/ — this file can stay as an offline/dev fallback.
 */
import { shopProducts, type ShopProduct } from '@/features/shop/data/products';
import {
  getProductBySlug as getShopProductBySlug,
  getRelatedProducts as getShopRelatedProducts,
} from '@/features/product/data/product-details';
import type { Category, CategoryKey, Product, ProductListQuery, ProductSummary } from '@/types';

function toSummary(p: ShopProduct): ProductSummary {
  return {
    id: p.slug,
    slug: p.slug,
    name: p.name,
    shortDescription: p.shortDescription,
    categoryKey: p.categoryKey as CategoryKey,
    price: p.price,
    currency: 'AFN',
    badge: p.badge,
    region: p.region,
    images: [{ src: null, alt: p.name }],
    inStock: true,
  };
}

function sortSummaries(items: ProductSummary[], sort: ProductListQuery['sort']): ProductSummary[] {
  const arr = [...items];
  switch (sort) {
    case 'priceAsc':
      arr.sort((a, b) => a.price - b.price);
      break;
    case 'priceDesc':
      arr.sort((a, b) => b.price - a.price);
      break;
    default:
      break;
  }
  return arr;
}

async function listProducts(query: ProductListQuery = {}): Promise<ProductSummary[]> {
  const q = query.q?.trim().toLowerCase() ?? '';
  let items = shopProducts.map(toSummary);

  if (query.categoryKey) {
    items = items.filter((p) => p.categoryKey === query.categoryKey);
  }
  if (q) {
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.region.toLowerCase().includes(q),
    );
  }
  return sortSummaries(items, query.sort);
}

async function getProductBySlug(slug: string): Promise<Product | null> {
  const detail = getShopProductBySlug(slug);
  if (!detail) return null;
  return {
    ...toSummary(detail),
    description: detail.description,
    features: detail.features,
    images: detail.gallery.map((_g, i) => ({
      src: null,
      alt: `${detail.name} — view ${i + 1}`,
    })),
  };
}

async function getRelatedProducts(slug: string, limit = 4): Promise<ProductSummary[]> {
  return getShopRelatedProducts(slug, limit).map(toSummary);
}

async function listCategories(): Promise<Category[]> {
  const counts = new Map<CategoryKey, number>();
  for (const p of shopProducts) {
    const key = p.categoryKey as CategoryKey;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([key, productCount]) => ({
    key,
    slug: key,
    name: key,
    productCount,
  }));
}

export const mockAdapter = {
  listProducts,
  getProductBySlug,
  getRelatedProducts,
  listCategories,
} as const;

export type MockAdapter = typeof mockAdapter;
