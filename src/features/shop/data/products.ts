import type { LucideIcon } from 'lucide-react';

/**
 * Shop catalog — served by the backend API in production.
 * This static array is intentionally empty; products are fetched
 * from /api/products once the catalog is live.
 */

export type ShopBadge = 'new' | 'best' | 'last' | 'sale';

export type ShopCategoryKey =
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

export interface ShopProduct {
  slug: string;
  name: string;
  shortDescription: string;
  categoryKey: ShopCategoryKey;
  price: number;
  badge?: ShopBadge;
  region: string;
  accent: { from: string; via?: string; to: string };
  Icon: LucideIcon;
}

export const shopProducts: ShopProduct[] = [];
