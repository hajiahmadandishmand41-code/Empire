import { cache } from 'react';
import { getProductService } from '@/server/infrastructure/registry';
import { rankProductsForUser } from './personalized-ranking';
import { getCurrentUser } from '@/lib/auth/current-user';
import { isDatabaseConfigured } from '@/lib/db';
import type { ProductSummary } from '@/types';
import type { SliderProduct } from '../components/product-slider-section';

type HomeSection = 'featured' | 'bestSelling' | 'newest' | 'popular' | 'mostViewed';
export type HomepageData = { newest: ProductSummary[]; bestSelling: ProductSummary[]; mostViewed: ProductSummary[]; popular: ProductSummary[]; featured: ProductSummary[] };
export type HomepageState = { status: 'ok'; data: HomepageData } | { status: 'unavailable'; data: HomepageData };
export type HomepageSectionState = { status: 'ok'; products: ProductSummary[] } | { status: 'unavailable'; products: [] };

const EMPTY_HOME_DATA: HomepageData = { newest: [], bestSelling: [], mostViewed: [], popular: [], featured: [] };

export const getHomepageDataState = cache(async (): Promise<HomepageState> => {
  // Fail closed when the deployment has no database connection: no fake data and no crash.
  if (!isDatabaseConfigured()) return { status: 'unavailable', data: EMPTY_HOME_DATA };
  try { return { status: 'ok', data: await getProductService().getHomepageSections(12) }; }
  catch { return { status: 'unavailable', data: EMPTY_HOME_DATA }; }
});

/** @deprecated Prefer getHomepageDataState so DB failure cannot be mistaken for empty data. */
export const getHomepageData = cache(async (): Promise<HomepageData> => {
  if (!isDatabaseConfigured()) return EMPTY_HOME_DATA;
  const state = await getHomepageDataState();
  return state.data;
});

export const getHomepageSectionState = cache(async (section: HomeSection, size = 12, userId?: string | null): Promise<HomepageSectionState> => {
  if (!isDatabaseConfigured()) return { status: 'unavailable', products: [] };
  try {
    const service = getProductService();
    const personalized = section === 'popular' || section === 'bestSelling';
    const effectiveUserId = userId ?? (personalized ? (await getCurrentUser())?.id ?? null : null);
    const usePersonalization = Boolean(effectiveUserId) && personalized;
    const candidateSize = usePersonalization ? Math.max(size * 3, 36) : size;
    const result = await service.listProducts({ isActive: true, page: 1, pageSize: candidateSize, sort: section === 'featured' ? 'featured' : section, ...(section === 'featured' ? { featured: true } : {}) });
    const products = usePersonalization ? await rankProductsForUser(result.products, effectiveUserId!, section) : result.products;
    return { status: 'ok', products: products.slice(0, size) };
  } catch { return { status: 'unavailable', products: [] }; }
});

/** @deprecated Prefer getHomepageSectionState so callers can distinguish empty from unavailable. */
export const getHomepageSection = cache(async (section: HomeSection, size = 12, userId?: string | null): Promise<ProductSummary[]> => {
  const state = await getHomepageSectionState(section, size, userId);
  return state.products;
});

export const getHeroProductsState = cache(async () => {
  if (!isDatabaseConfigured()) return { status: 'unavailable' as const, products: [] as ProductSummary[] };
  try {
    const result = await getProductService().listProducts({ badge: 'hero', page: 1, pageSize: 2, sort: 'newest', isActive: true });
    return { status: 'ok' as const, products: result.products.slice(0, 2) };
  } catch { return { status: 'unavailable' as const, products: [] as ProductSummary[] }; }
});

export const getHeroProducts = cache(async (): Promise<ProductSummary[]> => (await getHeroProductsState()).products);

export function toSliderProduct(product: ProductSummary, badge?: string): SliderProduct {
  return { id: product.id, name: product.name, slug: product.slug, price: product.price, comparePrice: product.comparePrice, images: product.images.map((image) => ({ url: image.src ?? '' })).filter((image) => image.url), badge: badge ?? product.badge, rating: product.averageRating, reviewCount: product.reviewCount, salesCount: product.salesCount, viewCount: product.viewCount, categoryKey: product.categoryKey, category: { name: product.categoryKey }, sellerId: product.sellerId, sellerShopName: product.sellerShopName, sellerWhatsapp: product.sellerWhatsapp ?? undefined, region: product.region, inStock: product.inStock };
}
