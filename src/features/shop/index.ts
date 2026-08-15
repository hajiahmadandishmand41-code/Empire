/**
 * Public surface of the `shop` feature.
 *
 * Phase 3 introduces the first real catalog surface — currently
 * backed entirely by in-memory mock data. The shop page composes:
 *   • <ShopPageClient/>   — search + category filter + result grid
 *   • <ShopProductCard/>  — individual product tile
 *   • <ShopToolbar/>      — search input + category pills
 *
 * The shared `home.categories.items` namespace is reused for
 * category labels so the two surfaces stay in lock-step.
 */
export { ShopPageClient } from './components/shop-page-client';
export { ShopProductCard } from './components/shop-product-card';
export { ShopToolbar } from './components/shop-toolbar';
export { shopProducts } from './data/products';
export type { ShopBadge, ShopCategoryKey, ShopProduct } from './data/products';
export type { ShopCategoryOption } from './components/shop-toolbar';
