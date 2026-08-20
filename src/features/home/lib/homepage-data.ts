import { cache } from 'react';
import { getProductService } from '@/server/infrastructure/registry';
import type { ProductSummary } from '@/types';
import type { SliderProduct } from '../components/product-slider-section';

type HomeSection = 'featured' | 'bestSelling' | 'newest' | 'popular';

export const getHomepageData = cache(async () => {
  try {
    return await getProductService().getHomepageSections(12);
  } catch {
    return { newest: [], bestSelling: [], mostViewed: [], popular: [], featured: [] };
  }
});

export const getHomepageSection = cache(async (section: HomeSection, size = 12): Promise<ProductSummary[]> => {
  try {
    const service = getProductService();
    const result = await service.listProducts({
      isActive: true,
      page: 1,
      pageSize: size,
      sort: section === 'featured' ? 'featured' : section,
      ...(section === 'featured' ? { featured: true } : {}),
    });
    return result.products;
  } catch {
    return [];
  }
});

export const getHeroProducts = cache(async (): Promise<ProductSummary[]> => {
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
