import type { Order, OrderDraft } from '@/types';
import type { ApiResponse } from '@/types/api';
import { apiConfig } from './config';
import { apiFetch } from './client';
import { endpoints } from './endpoints';

/**
 * Create a new order.
 *
 * - If `NEXT_PUBLIC_API_BASE_URL` is set, calls the external backend.
 * - Otherwise calls the built-in Next.js API route `/api/orders`.
 * - NEVER falls back to a mock order in any environment.
 *   If the API fails, the error is propagated so the UI can show a
 *   real error message and let the user retry (cart is NOT cleared).
 */
export async function createOrder(draft: OrderDraft): Promise<Order> {
  if (apiConfig.isRemote) {
    const res = await apiFetch<ApiResponse<Order>>(endpoints.orders.create, {
      method: 'POST',
      body: JSON.stringify(draft),
    });
    if (res.ok) return res.data;
    throw new Error(res.error.message);
  }

  // Internal Next.js API route — always available in all environments.
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  });

  let json: ApiResponse<Order>;
  try {
    json = (await res.json()) as ApiResponse<Order>;
  } catch {
    throw new Error(`Order API returned non-JSON (status ${res.status})`);
  }

  if (json.ok && json.data) return json.data;

  const msg =
    !json.ok && 'error' in json && json.error
      ? json.error.message
      : `Order creation failed (HTTP ${res.status})`;
  throw new Error(msg);
}

export async function getOrderById(id: string): Promise<Order | null> {
  if (!apiConfig.isRemote) return null;
  try {
    const res = await apiFetch<ApiResponse<Order>>(endpoints.orders.byId(id));
    if (res.ok) return res.data;
    return null;
  } catch (err) {
    console.warn('[api] getOrderById error:', err);
    return null;
  }
}
