/**
 * Product & category domain types.
 *
 * Shape is designed to match a future REST/GraphQL backend response.
 * The current mock layer (`src/lib/mock`) returns objects that
 * satisfy these types, so swapping in a real API only requires
 * changing `src/lib/api/*` implementations — no component changes.
 */

export type ProductBadge = 'new' | 'best' | 'last' | 'sale';

export type CategoryKey =
  | 'clothing'
  | 'digital'
  | 'homeAppliances'
  | 'beauty'
  | 'sports'
  | 'footwear'
  | 'baby'
  | 'books'
  | 'electronics'
  | 'watches';

/** Currency codes supported. */
export type CurrencyCode = 'AFN' | 'USD' | 'EUR';

/**
 * A single product image. `src` is nullable so the current
 * placeholder-visual products (icon + gradient) can still fit.
 */
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
  /** Free-form stock indicator; the API layer may return a number later. */
  inStock: boolean;
  /** Optional seller / vendor info for filtering & display (Phase 6). */
  sellerId?: string | null;
  sellerShopName?: string | null;
  /** Aggregate rating for this product (Phase 6). */
  averageRating?: number;
  reviewCount?: number;
  /** Delivered-order counter used for "best selling" sort (Phase 6). */
  salesCount?: number;
  /** Page-view counter used for "most viewed" sort. */
  viewCount?: number;
  /** Seller WhatsApp number for direct buyer contact. */
  sellerWhatsapp?: string | null;
  comparePrice?: number | null;
  /**
   * Optional video URL for product demo.
   * Supports: YouTube (youtube.com/watch?v=... | youtu.be/...),
   * Vimeo (vimeo.com/...), or direct video file (.mp4, .webm, etc.)
   */
  videoUrl?: string | null;
  isTraditional?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Product summary used in listings (shop grid, related, etc.). */
export type ProductSummary = Omit<Product, 'description' | 'features'>;
