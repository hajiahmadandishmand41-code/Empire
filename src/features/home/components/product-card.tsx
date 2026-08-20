'use client';

import type { ProductSummary } from '@/types';
import type { FeaturedProduct } from '../data/featured-products';
import { MarketplaceProductCard } from '@/components/marketplace-product-card';

interface ProductCardProps {
  product: FeaturedProduct;
  currency?: string;
  locale?: string;
  whatsappNumber?: string;
  salesCount?: number;
  viewCount?: number;
}

export function ProductCard({ product, currency = 'AFN', locale = 'fa', whatsappNumber, salesCount, viewCount }: ProductCardProps) {
  const sharedProduct: ProductSummary = {
    id: product.slug,
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription,
    categoryKey: product.categoryKey,
    price: product.price,
    currency: currency === 'USD' || currency === 'EUR' ? currency : 'AFN',
    badge: product.badge,
    region: 'افغانستان',
    images: [],
    inStock: true,
    sellerId: product.sellerId,
    sellerShopName: product.sellerShopName,
    salesCount,
    viewCount,
  };

  return <MarketplaceProductCard product={sharedProduct} locale={locale} currency={currency} whatsappNumber={whatsappNumber} showDescription />;
}
