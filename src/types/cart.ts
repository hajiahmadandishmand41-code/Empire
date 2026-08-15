import type { CategoryKey, CurrencyCode } from './product';

/**
 * Cart line stored client-side. Kept intentionally minimal and
 * serializable — no React components, no icons — so it can round-trip
 * through localStorage and, later, through a backend cart API.
 *
 * The existing feature-level `CartItem` (in `src/features/cart/types.ts`)
 * carries a runtime-only `Icon` for the current placeholder visuals
 * and extends this base shape.
 */
export interface CartLineBase {
  productId?: string;
  slug: string;
  name: string;
  price: number;
  currency?: CurrencyCode;
  quantity: number;
  region?: string;
  categoryKey?: CategoryKey;
}

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  currency: CurrencyCode;
}
