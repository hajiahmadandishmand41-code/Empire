'use client';

import * as React from 'react';
import { useCartStore } from '../store/cart-store';
import type { CartItem } from '../types';

/**
 * Returns persisted cart items after hydration. Cart items are fully
 * serializable and no longer depend on the legacy in-memory catalog.
 */
export function useHydratedCartItems(): {
  items: CartItem[];
  hydrated: boolean;
} {
  const rawItems = useCartStore((s) => s.items);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  const items = React.useMemo<CartItem[]>(() => rawItems, [rawItems]);

  return { items: hydrated ? items : [], hydrated };
}

/** Hydration-safe cart count for header badge. */
export function useHydratedCartCount(): number {
  const items = useCartStore((s) => s.items);
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => {
    setHydrated(true);
  }, []);
  if (!hydrated) return 0;
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
