'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { ShoppingCart } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useHydratedCartCount } from '../hooks/use-hydrated-cart';
import { cn } from '@/lib/utils';

export function CartBadge({ className }: { className?: string }) {
  const t = useTranslations('cart');
  const count = useHydratedCartCount();

  return (
    <Link
      href="/cart"
      aria-label={t('title')}
      className={cn(
        'group relative inline-flex items-center gap-2 rounded-xl border',
        'border-border bg-background text-foreground shadow-xs',
        'px-2.5 py-2 text-sm font-medium transition-all',
        'hover:border-rose-200 dark:hover:border-rose-800',
        'hover:bg-rose-50/50 dark:hover:bg-rose-950/30',
        'hover:text-rose-600 dark:hover:text-rose-400',
        className,
      )}
    >
      <div className="relative">
        <ShoppingCart className="h-5 w-5" aria-hidden />
        {count > 0 && (
          <span
            aria-hidden="true"
            className="absolute -end-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold leading-none text-white"
          >
            {count > 9 ? '۹+' : count}
          </span>
        )}
      </div>
      <span className="hidden sm:inline text-xs">{t('title')}</span>
    </Link>
  );
}
