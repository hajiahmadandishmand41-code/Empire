export const endpoints = {
  products: {
    list: '/products',
    bySlug: (slug: string) => `/products/${encodeURIComponent(slug)}`,
  },
  categories: {
    list: '/categories',
  },
  orders: {
    create: '/orders',
    byId: (id: string) => `/orders/${encodeURIComponent(id)}`,
  },
} as const;
