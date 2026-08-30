/** Product & category domain types. */
export type ProductBadge = 'new' | 'best' | 'last' | 'sale';

export type CategoryKey =
  | 'clothing' | 'digital' | 'homeAppliances' | 'beauty' | 'sports' | 'footwear' | 'baby' | 'books' | 'electronics' | 'watches';

export type CurrencyCode = 'AFN' | 'USD' | 'EUR';

export interface ProductImage {
  src: string | null;
  alt: string;
  width?: number;
  height?: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description?: string[];
  categoryKey: CategoryKey;
  price: number;
  currency: CurrencyCode;
  badge?: ProductBadge;
  region: string;
  images: ProductImage[];
  features?: string[];
  inStock: boolean;
  sellerId?: string | null;
  sellerName?: string | null;
  sellerShopName?: string | null;
  averageRating?: number;
  reviewCount?: number;
  salesCount?: number;
  viewCount?: number;
  sellerWhatsapp?: string | null;
  comparePrice?: number | null;
  /** Legacy read-only product field; media upload is image-only. */
  videoUrl?: string | null;
  isTraditional?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ProductSummary = Omit<Product, 'description' | 'features'>;
