import * as React from 'react';
import { cn } from '@/lib/utils';

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  sm?: 1 | 2 | 3 | 4 | 5 | 6;
  md?: 1 | 2 | 3 | 4 | 5 | 6;
  lg?: 1 | 2 | 3 | 4 | 5 | 6;
  xl?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: '0' | '2' | '3' | '4' | '6' | '8';
}

const GAP: Record<NonNullable<GridProps['gap']>, string> = {
  '0': 'gap-0',
  '2': 'gap-2',
  '3': 'gap-3',
  '4': 'gap-4',
  '6': 'gap-6',
  '8': 'gap-8',
};

const COLS: Record<NonNullable<GridProps['cols']>, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  12: 'grid-cols-12',
};

const BP_COLS = {
  sm: {
    1: 'sm:grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4',
    5: 'sm:grid-cols-5',
    6: 'sm:grid-cols-6',
  },
  md: {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    5: 'md:grid-cols-5',
    6: 'md:grid-cols-6',
  },
  lg: {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
    6: 'lg:grid-cols-6',
  },
  xl: {
    1: 'xl:grid-cols-1',
    2: 'xl:grid-cols-2',
    3: 'xl:grid-cols-3',
    4: 'xl:grid-cols-4',
    5: 'xl:grid-cols-5',
    6: 'xl:grid-cols-6',
  },
};

/**
 * Responsive CSS-grid wrapper.
 * Resolves to `grid` with consistent gaps across breakpoints.
 */
export function Grid({ className, cols = 1, sm, md, lg, xl, gap = '6', ...props }: GridProps) {
  return (
    <div
      className={cn(
        'grid',
        COLS[cols],
        sm && BP_COLS.sm[sm],
        md && BP_COLS.md[md],
        lg && BP_COLS.lg[lg],
        xl && BP_COLS.xl[xl],
        GAP[gap],
        className,
      )}
      {...props}
    />
  );
}
