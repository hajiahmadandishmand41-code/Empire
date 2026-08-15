import * as React from 'react';
import { cn } from '@/lib/utils';

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Vertical or horizontal? */
  direction?: 'row' | 'col';
  /** Logical-property safe alignment (works in both LTR & RTL). */
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  /** Tailwind-friendly gap scale. */
  gap?: '0' | '1' | '2' | '3' | '4' | '5' | '6' | '8' | '10' | '12';
  /** When `direction` flips in RTL contexts. */
  wrap?: boolean;
}

const GAP: Record<NonNullable<StackProps['gap']>, string> = {
  '0': 'gap-0',
  '1': 'gap-1',
  '2': 'gap-2',
  '3': 'gap-3',
  '4': 'gap-4',
  '5': 'gap-5',
  '6': 'gap-6',
  '8': 'gap-8',
  '10': 'gap-10',
  '12': 'gap-12',
};

const ALIGN: Record<NonNullable<StackProps['align']>, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

const JUSTIFY: Record<NonNullable<StackProps['justify']>, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

/**
 * Flex stack with logical-property safe alignment.
 * Use this anywhere you'd reach for a flexbox div — keeps spacing consistent.
 */
export function Stack({
  className,
  direction = 'col',
  align = 'stretch',
  justify,
  gap = '4',
  wrap = false,
  ...props
}: StackProps) {
  return (
    <div
      className={cn(
        'flex',
        direction === 'row' ? 'flex-row' : 'flex-col',
        ALIGN[align],
        justify && JUSTIFY[justify],
        GAP[gap],
        wrap && 'flex-wrap',
        className,
      )}
      {...props}
    />
  );
}
