'use client';

import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * StarRating — Phase 6.
 *
 * Presentational component when `onChange` is undefined; becomes
 * an interactive 1..5 picker when `onChange` is provided.
 * `value` may be fractional (e.g. 4.3) for aggregate displays;
 * interactive mode always emits an integer.
 */
export interface StarRatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (value: number) => void;
  className?: string;
  ariaLabel?: string;
}

export function StarRating({
  value,
  max = 5,
  size = 'md',
  onChange,
  className,
  ariaLabel,
}: StarRatingProps) {
  const [hover, setHover] = React.useState<number | null>(null);
  const active = hover ?? value;

  const dim = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';
  const interactive = typeof onChange === 'function';

  return (
    <div
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={ariaLabel ?? `Rating ${value} out of ${max}`}
      className={cn('inline-flex items-center gap-0.5', className)}
      onMouseLeave={interactive ? () => setHover(null) : undefined}
    >
      {Array.from({ length: max }, (_, i) => {
        const idx = i + 1;
        const filled = idx <= Math.round(active);
        const Icon = (
          <Star
            className={cn(
              dim,
              filled ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground/40',
            )}
            aria-hidden="true"
          />
        );
        if (!interactive) return <span key={idx}>{Icon}</span>;
        return (
          <button
            key={idx}
            type="button"
            role="radio"
            aria-checked={idx === Math.round(value)}
            aria-label={`${idx} star${idx > 1 ? 's' : ''}`}
            onMouseEnter={() => setHover(idx)}
            onFocus={() => setHover(idx)}
            onClick={() => onChange!(idx)}
            className="rounded p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {Icon}
          </button>
        );
      })}
    </div>
  );
}
