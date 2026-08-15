/** Generic API response envelopes — mirror a typical REST backend. */

export interface ApiSuccess<T> {
  ok: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiFailure {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProductListQuery {
  q?: string;
  categoryKey?: string;
  sellerId?: string;
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  page?: number;
  pageSize?: number;
  sort?:
    | 'newest'
    | 'priceAsc'
    | 'priceDesc'
    | 'bestSelling'
    | 'bestseller'
    | 'mostViewed'
    | 'popular'
    | 'featured';
}
