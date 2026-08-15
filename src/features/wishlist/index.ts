/**
 * Public surface of the `wishlist` feature.
 */
export {
  useWishlistStore,
  selectWishlistCount,
  WISHLIST_STORAGE_KEY,
} from './store/wishlist-store';
export { WishlistButton } from './components/wishlist-button';
export type { WishlistButtonProps } from './components/wishlist-button';
export { WishlistPageView } from './components/wishlist-page-view';
