/**
 * @deprecated Legacy Drizzle schema compatibility stub.
 *
 * Prisma is the application's database layer. These typed table markers are
 * retained only for legacy imports and must not be used for new queries.
 */

import type { LegacyTable } from './index';

function makeTable(name: string): LegacyTable {
  return { _tableName: name };
}

export const sellers = makeTable('sellers');
export const storeProfiles = makeTable('store_profiles');
export const products = makeTable('products');
export const orders = makeTable('orders');
export const orderItems = makeTable('order_items');
export const transactions = makeTable('transactions');
export const notifications = makeTable('notifications');
export const reviews = makeTable('reviews');
export const categories = makeTable('categories');
export const productImages = makeTable('product_images');
export const productVariants = makeTable('product_variants');
export const coupons = makeTable('coupons');
export const wishlistItems = makeTable('wishlist_items');
export const cartItems = makeTable('cart_items');
