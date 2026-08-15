import type { Product, ProductListQuery, ProductSummary } from '@/types';
import type { ApiResponse } from '@/types/api';
import { apiConfig } from './config';
import { apiFetch } from './client';
import { endpoints } from './endpoints';

function unwrap<T>(res: ApiResponse<T>): T {
  if (res.ok) return res.data;
  throw new Error(res.error?.message ?? 'API error');
}

export async function getProducts(query: ProductListQuery = {}): Promise<ProductSummary[]> {
  if (!apiConfig.isRemote) throw new Error('Product API is not configured');
  try {
    const qs = new URLSearchParams();
    if (query.q) qs.set('q', query.q);
    if (query.categoryKey) qs.set('categoryKey', query.categoryKey);
    if (query.page) qs.set('page', String(query.page));
    if (query.pageSize) qs.set('pageSize', String(query.pageSize));
    if (query.sort) qs.set('sort', query.sort);
    const path = `${endpoints.products.list}${qs.size ? `?${qs.toString()}` : ''}`;
    const res = await apiFetch<ApiResponse<ProductSummary[]>>(path);
    return unwrap(res);
  } catch (err) {
    console.error('[api] getProducts failed:', err);
    throw err;
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!apiConfig.isRemote) throw new Error('Product API is not configured');
  try {
    const res = await apiFetch<ApiResponse<Product>>(endpoints.products.bySlug(slug));
    return unwrap(res);
  } catch (err) {
    console.error('[api] getProductBySlug failed:', err);
    throw err;
  }
}

export async function getRelatedProducts(slug: string, limit = 4): Promise<ProductSummary[]> {
  if (!apiConfig.isRemote) throw new Error('Product API is not configured');
  const res = await apiFetch<ApiResponse<ProductSummary[]>>(`${endpoints.products.bySlug(slug)}/related?limit=${limit}`);
  return unwrap(res);
}
