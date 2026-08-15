/**
 * Phase 6 — domain types for reviews, wishlist, product ratings.
 */
import type { ProductSummary } from './product';

export interface ReviewAuthor {
  id: string;
  fullName: string;
}

export interface Review {
  id: string;
  productId: string;
  productSlug?: string;
  rating: number;
  title?: string;
  comment?: string;
  isApproved: boolean;
  author: ReviewAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface ProductRatingSummary {
  average: number;
  count: number;
  /** Distribution buckets keyed by star (1..5). */
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface WishlistEntry {
  id: string;
  productId: string;
  createdAt: string;
  product: ProductSummary;
}
