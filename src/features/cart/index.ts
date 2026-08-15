/**
 * Public surface of the `cart` feature (Phase 5).
 *
 * A pure-frontend shopping cart:
 *   - Zustand store persisted to localStorage
 *   - Header badge with total item count
 *   - Full cart page (list + summary + controls)
 *   - Floating WhatsApp contact button (global)
 *
 * No backend, no checkout, no payments in this phase.
 */
export {
  useCartStore,
  selectCartCount,
  selectCartTotal,
  CART_STORAGE_KEY,
} from './store/cart-store';
export { useHydratedCartItems, useHydratedCartCount } from './hooks/use-hydrated-cart';
export { CartBadge } from './components/cart-badge';
export { CartLine } from './components/cart-line';
export { CartView } from './components/cart-view';
export { WhatsAppFloatButton } from './components/whatsapp-float-button';
export type { CartItem, CartItemInput } from './types';
