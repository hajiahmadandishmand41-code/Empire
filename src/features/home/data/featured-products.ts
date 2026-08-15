import type { LucideIcon } from 'lucide-react';

/**
 * Featured products — loaded from the API in production.
 * This array is intentionally empty; real products are served
 * by the backend and fetched client-side once the catalog is live.
 */

export type FeaturedBadge = 'new' | 'best' | 'last';

export interface FeaturedProduct {
  slug: string;
  name: string;
  shortDescription: string;
  categoryKey:
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
  price: number;
  badge?: FeaturedBadge;
  accent: { from: string; via?: string; to: string };
  Icon: LucideIcon;
  sellerId?: string | null;
  sellerShopName?: string | null;
}

export const featuredProducts: FeaturedProduct[] = [];
