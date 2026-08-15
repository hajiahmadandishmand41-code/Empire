import * as products from './products';
import * as categories from './categories';
import * as orders from './orders';

export const api = {
  products: {
    list: products.getProducts,
    bySlug: products.getProductBySlug,
    related: products.getRelatedProducts,
  },
  categories: { list: categories.getCategories },
  orders: { create: orders.createOrder, byId: orders.getOrderById },
} as const;

export { apiConfig } from './config';
export { ApiError, isApiError } from './errors';
export { endpoints } from './endpoints';
export type { ApiConfig } from './config';
