import type { Category } from '@/types';
import type { ApiResponse } from '@/types/api';
import { apiConfig } from './config';
import { apiFetch } from './client';
import { endpoints } from './endpoints';

export async function getCategories(): Promise<Category[]> {
  if (!apiConfig.isRemote) throw new Error('Category API is not configured');
  try {
    const res = await apiFetch<ApiResponse<Category[]>>(endpoints.categories.list);
    if (res.ok) return res.data;
    throw new Error(res.error.message);
  } catch (err) {
    console.error('[api] getCategories failed:', err);
    throw err;
  }
}
