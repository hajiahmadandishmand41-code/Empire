import * as React from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

/**
 * Centered, max-width wrapper.
 *
 * - `sm`  → 640px   (forms, narrow articles)
 * - `md`  → 768px   (checkout)
 * - `lg`  → 1024px  (categories)
 * - `xl`  → 1280px  (default — products listing)
 * - `full` → 100% + padding only
 */
const SIZE_TO_MAX: Record<NonNullable<ContainerProps['size']>, string> = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  full: 'max-w-none',
};

export function Container({ className, size = 'xl', ...props }: ContainerProps) {
  return (
    <div
      className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', SIZE_TO_MAX[size], className)}
      {...props}
    />
  );
}
