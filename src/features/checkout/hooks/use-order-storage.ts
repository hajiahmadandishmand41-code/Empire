'use client';

import type { Order } from '@/types';

/**
 * Session-only storage for the last mock order, so the /order/success
 * page can display its reference & summary without a backend.
 */
export const LAST_ORDER_KEY = 'empire-shop:last-order:v1';

export function saveLastOrder(order: Order): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
  } catch {
    /* storage unavailable — non-fatal */
  }
}

export function readLastOrder(): Order | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(LAST_ORDER_KEY);
    return raw ? (JSON.parse(raw) as Order) : null;
  } catch {
    return null;
  }
}

export function clearLastOrder(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(LAST_ORDER_KEY);
  } catch {
    /* ignore */
  }
}
