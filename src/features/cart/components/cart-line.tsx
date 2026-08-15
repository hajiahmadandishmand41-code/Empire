'use client';

import * as React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Minus, Plus, Trash2, Package, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice, cn } from '@/lib/utils';
import { useCartStore } from '../store/cart-store';
import type { CartItem } from '../types';

interface CartLineProps {
  item: CartItem;
  locale: string;
  currency?: string;
}

export function CartLine({ item, locale, currency = 'AFN' }: CartLineProps) {
  const t = useTranslations('cart');
  const { removeItem, incrementItem, decrementItem } = useCartStore();
  const { name, region, price, quantity, slug, images } = item;

  const lineTotal = price * quantity;

  return (
    <li className="flex items-start gap-3.5 rounded-2xl border border-border bg-card shadow-sm p-3.5 shadow-xs sm:gap-4 sm:p-4">
      {/* Visual */}
      <div
        className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted sm:h-24 sm:w-24"
      >
        {images[0]?.src ? <Image src={images[0].src!} alt={images[0].alt || name} fill sizes="96px" className="object-cover" /> : <ImageOff className="h-6 w-6 text-muted-foreground/50" aria-hidden />}
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div>
          <h3 className="text-sm font-semibold leading-snug text-foreground sm:text-base">
            {name}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{region}</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          {/* Quantity stepper */}
          <div className="inline-flex items-center rounded-lg border border-border bg-background">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-foreground hover:bg-muted"
              onClick={() => decrementItem(slug)}
              aria-label={t('decrease')}
            >
              <Minus className="h-3 w-3" aria-hidden />
            </Button>
            <span
              className="num-ltr w-7 text-center text-sm font-semibold text-foreground"
              aria-live="polite"
            >
              {quantity}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-foreground hover:bg-muted"
              onClick={() => incrementItem(slug)}
              aria-label={t('increase')}
            >
              <Plus className="h-3 w-3" aria-hidden />
            </Button>
          </div>

          {/* Price + remove */}
          <div className="flex flex-col items-end gap-0.5">
            <span className="num-ltr text-sm font-bold text-foreground sm:text-base">
              {formatPrice(lineTotal, currency, locale)}
            </span>
            <button
              type="button"
              onClick={() => removeItem(slug)}
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-red-500 transition-colors"
              aria-label={t('remove')}
            >
              <Trash2 className="h-3 w-3" aria-hidden />
              <span>{t('remove')}</span>
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
