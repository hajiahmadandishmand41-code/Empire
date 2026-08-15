'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Wishlist store — Phase 6 scaffold.
 *
 * Persists slugs to localStorage. Pure-frontend today; when a
 * backend arrives, `add`/`remove`/`toggle` become the natural
 * hook points to sync with an `/api/wishlist` endpoint.
 */
interface WishlistState {
  slugs: string[];
  add: (slug: string) => void;
  remove: (slug: string) => void;
  toggle: (slug: string) => void;
  has: (slug: string) => boolean;
  clear: () => void;
}

export const WISHLIST_STORAGE_KEY = 'empire-shop:wishlist:v1';

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      slugs: [],
      add: (slug) => set((s) => (s.slugs.includes(slug) ? s : { slugs: [...s.slugs, slug] })),
      remove: (slug) => set((s) => ({ slugs: s.slugs.filter((x) => x !== slug) })),
      toggle: (slug) =>
        set((s) =>
          s.slugs.includes(slug)
            ? { slugs: s.slugs.filter((x) => x !== slug) }
            : { slugs: [...s.slugs, slug] },
        ),
      has: (slug) => get().slugs.includes(slug),
      clear: () => set({ slugs: [] }),
    }),
    {
      name: WISHLIST_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function selectWishlistCount(state: WishlistState): number {
  return state.slugs.length;
}
