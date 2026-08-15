'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, CartItemInput } from '../types';

/**
 * Cart store — Zustand + localStorage persistence.
 *
 * Cart data is intentionally serializable so persisted state can be restored
 * safely across reloads.
 */
interface CartState {
  items: CartItem[];
  addItem: (item: CartItemInput) => void;
  removeItem: (slug: string) => void;
  incrementItem: (slug: string) => void;
  decrementItem: (slug: string) => void;
  clear: () => void;
}

export const CART_STORAGE_KEY = 'empire-shop:cart:v1';

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.slug === item.slug);
          const addQty = item.quantity ?? 1;
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.slug === item.slug ? { ...i, quantity: i.quantity + addQty } : i,
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: addQty }],
          };
        }),
      removeItem: (slug) =>
        set((state) => ({
          items: state.items.filter((i) => i.slug !== slug),
        })),
      incrementItem: (slug) =>
        set((state) => ({
          items: state.items.map((i) => (i.slug === slug ? { ...i, quantity: i.quantity + 1 } : i)),
        })),
      decrementItem: (slug) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.slug === slug ? { ...i, quantity: i.quantity - 1 } : i))
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: CART_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

/** Derived total item count (sum of quantities). */
export function selectCartCount(state: CartState): number {
  return state.items.reduce((sum, i) => sum + i.quantity, 0);
}

/** Derived total price. */
export function selectCartTotal(state: CartState): number {
  return state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}
