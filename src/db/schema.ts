/**
 * @deprecated — Legacy Drizzle schema stub.
 *
 * This project now uses Prisma exclusively (prisma/schema.prisma).
 * These exports are kept ONLY to prevent import errors in legacy files.
 * DO NOT use in new code.
 *
 * Removal: safe to delete once no file imports from '@/db/schema'.
 *
 * @module drizzle-schema-stub
 */

// Stub table objects that old routes imported
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeTable = (name: string): any => ({ _tableName: name });

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