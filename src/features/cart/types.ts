import type { CategoryKey, ProductImage } from '@/types';

/**
 * Cart item — minimal snapshot of a product at the time of adding
 * to the cart, plus a `quantity` counter. We snapshot fields so
 * subsequent catalog edits don't retroactively mutate cart lines.
 *
 * Images are snapshotted so the cart remains renderable even if a product
 * later changes in the catalog.
 */
export interface CartItem {
  slug: string;
  name: string;
  price: number;
  region: string;
  categoryKey: CategoryKey;
  images: ProductImage[];
  quantity: number;
}

/** Input accepted by `addItem` — quantity + Icon default sensibly. */
export type CartItemInput = Omit<CartItem, 'quantity'> & {
  quantity?: number;
};
