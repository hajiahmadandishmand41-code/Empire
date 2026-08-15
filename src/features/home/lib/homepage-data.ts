import { cache } from 'react';
import { getProductService } from '@/server/infrastructure/registry';
import type { ProductSummary } from '@/types';
import type { SliderProduct } from '../components/product-slider-section';

export const getHomepageData = cache(async () => {
  try {
    return await getProductService().getHomepageSections(12);
  } catch {
    // A clean build may run before the deployment database has been migrated.
    // The live app still uses the same service above once the catalog is ready.
    return {
      newest: [],
      bestSelling: [],
      mostViewed: [],
      popular: [],
      featured: [],
    };
  }
});

export function toSliderProduct(product: ProductSummary, badge?: string): SliderProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    comparePrice: product.comparePrice,
    images: product.images
      .map((image) => ({ url: image.src ?? '' }))
      .filter((image) => image.url),
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