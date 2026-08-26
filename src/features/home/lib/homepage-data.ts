import { cache } from 'react';
import { getProductService } from '@/server/infrastructure/registry';
import { rankProductsForUser } from './personalized-ranking';
import { getCurrentUser } from '@/lib/auth/current-user';
import { isDatabaseConfigured } from '@/lib/db';
import type { ProductSummary } from '@/types';
import type { SliderProduct } from '../components/product-slider-section';

type HomeSection = 'featured' | 'bestSelling' | 'newest' | 'popular' | 'mostViewed';

const EMPTY_HOME_DATA = { newest: [], bestSelling: [], mostViewed: [], popular: [], featured: [] } as const;

export const getHomepageData = cache(async () => {
  if (!isDatabaseConfigured()) return EMPTY_HOME_DATA;
  try {
    return await getProductService().getHomepageSections(12);
  } catch {
    return EMPTY_HOME_DATA;
  }
});

export const getHomepageSection = cache(async (section: HomeSection, size = 12, userId?: string | null): Promise<ProductSummary[]> => {
  if (!isDatabaseConfigured()) return [];
  try {
    const service = getProductService();
    const personalized = section === 'popular' || section === 'bestSelling';
    const effectiveUserId = userId ?? (personalized ? (await getCurrentUser())?.id ?? null : null);
    const usePersonalization = Boolean(effectiveUserId) && personalized;
    const candidateSize = usePersonalization ? Math.max(size * 3, 36) : size;
    const result = await service.listProducts({
      isActive: true,
      page: 1,
      pageSize: candidateSize,
      sort: section === 'featured' ? 'featured' : section,
      ...(section === 'featured' ? { featured: true } : {}),
    });
    const products = usePersonalization ? await rankProductsForUser(result.products, effectiveUserId!, section) : result.products;
    return products.slice(0, size);
  } catch {
    return [];
  }
});

export const getHeroProducts = cache(async (): Promise<ProductSummary[]> => {
  if (!isDatabaseConfigured()) return [];
  try {
    const result = await getProductService().listProducts({ badge: 'hero', page: 1, pageSize: 2, sort: 'newest', isActive: true });
    return result.products.slice(0, 2);
  } catch {
    return [];
  }
});

export function toSliderProduct(product: ProductSummary, badge?: string): SliderProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    comparePrice: product.comparePrice,
    images: product.images.map((image) => ({ url: image.src ?? '' })).filter((image) => image.url),
    badge: badge ?? product.badge,
    rating: product.averageRating,
    reviewCount: product.reviewCount,
    salesCount: product.salesCount,
    viewCount: product.viewCount,
    categoryKey: product.categoryKey,
    category: { name: product.categoryKey },
    sellerId: product.sellerId,
    sellerShopName: product.sellerShopName,
    sellerWhatsapp: product.sellerWhatsapp ?? undefined,
    region: product.region,
    inStock: product.inStock,
  };
}
