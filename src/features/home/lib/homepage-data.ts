import { cache } from 'react';
import { getProductService } from '@/server/infrastructure/registry';
import type { ProductSummary } from '@/types';
import type { SliderProduct } from '../components/product-slider-section';

export const getHomepageData = cache(async () => {
  try {
    return await getProductService().getHomepageSections(12);
  } catch {
    return { newest: [], bestSelling: [], mostViewed: [], popular: [], featured: [] };
  }
});

/**
 * Hero feed: prefer products explicitly promoted by admin, then fall back to
 * the marketplace ranking so the Hero never renders empty just because no
 * item has the legacy `hero` badge.
 */
export const getHeroProducts = cache(async (): Promise<ProductSummary[]> => {
  const service = getProductService();
  try {
    const promoted = await service.listProducts({
      badge: 'hero',
      page: 1,
      pageSize: 2,
      sort: 'popular',
      isActive: true,
    });
    if (promoted.products.length >= 2) return promoted.products.slice(0, 2);

    const ranked = await service.listProducts({
      page: 1,
      pageSize: 2,
      sort: 'recommended',
      isActive: true,
    });
    const merged = [...promoted.products, ...ranked.products];
    return merged.filter((product, index, all) => all.findIndex((item) => item.id === product.id) === index).slice(0, 2);
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
    category: { name: product.categoryKey },
    sellerId: product.sellerId,
    sellerShopName: product.sellerShopName,
    sellerWhatsapp: product.sellerWhatsapp ?? undefined,
  };
}
