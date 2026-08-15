'use client';

import * as React from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWishlistStore } from '../store/wishlist-store';

/**
 * WishlistButton — Phase 6.
 *
 * Toggles a product's wishlist state. Uses the local Zustand store
 * (localStorage-backed) for instant UX; when the user is signed in
 * and `productId` is provided, it also POSTs / DELETEs against the
 * `/api/wishlist` endpoint so favorites persist across devices.
 *
 * The component is intentionally headless-friendly: consumers can
 * pass their own class names to match the surrounding surface.
 */
export interface WishlistButtonProps {
  slug: string;
  productId?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  labelOn?: string;
  labelOff?: string;
}

export function WishlistButton({
  slug,
  productId,
  size = 'md',
  className,
  labelOn = 'Saved',
  labelOff = 'Save',
}: WishlistButtonProps) {
  const has = useWishlistStore((s) => s.slugs.includes(slug));
  const toggle = useWishlistStore((s) => s.toggle);
  const [busy, setBusy] = React.useState(false);

  const dimensions =
    size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-10 w-10';
  const iconSize = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  const onClick = React.useCallback(async () => {
    // Optimistic local toggle.
    toggle(slug);
    if (!productId) return;
    setBusy(true);
    try {
      if (!has) {
        await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ productId }),
        });
      } else {
        await fetch(`/api/wishlist/${encodeURIComponent(productId)}`, {
          method: 'DELETE',
        });
      }
    } catch (err) {
      // Silent: local store already reflects intent; API errors are
      // non-fatal for the shopping experience.
      console.warn('[wishlist] sync failed', err);
    } finally {
      setBusy(false);
    }
  }, [has, productId, slug, toggle]);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={has}
      aria-label={has ? labelOn : labelOff}
      disabled={busy}
      className={cn(
        'inline-flex items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors',
        'hover:text-destructive focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        has && 'border-destructive/30 text-destructive',
        dimensions,
        className,
      )}
    >
      <Heart className={cn(iconSize, has && 'fill-current')} aria-hidden />
    </button>
  );
}
