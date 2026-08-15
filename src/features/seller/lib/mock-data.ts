/**
 * Seller mock data — Phase 11.1.
 *
 * Fallback stats for the seller dashboard when the database is not
 * configured or empty. Derived from the in-memory shop catalog so
 * numbers stay coherent with the storefront.
 */
import { shopProducts } from '@/features/shop/data/products';

export interface SellerStats {
  products: number;
  orders: number;
  activeProducts: number;
  outOfStockProducts: number;
}

const total = shopProducts.length;
// Deterministic mock split: ~85% active, remainder out of stock.
const outOfStock = Math.max(1, Math.round(total * 0.15));
const active = Math.max(0, total - outOfStock);

export const mockSellerStats: SellerStats = {
  products: total,
  orders: 12,
  activeProducts: active,
  outOfStockProducts: outOfStock,
};
