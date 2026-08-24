'use client';

import * as React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { ImageOff, ZoomIn } from 'lucide-react';
import type { ProductImage } from '@/types';

interface ProductGalleryProps {
  productName: string;
  images: ProductImage[];
}

export function ProductGallery({ productName, images }: ProductGalleryProps) {
  const [active, setActive] = React.useState(0);
  const t = useTranslations('product');

  const items = images.length > 0 ? images : [{ src: null, alt: productName }];
  const current = items[active] ?? items[0]!;

  return (
    <div className="flex flex-col gap-3">
      <div className="group relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-muted/20 shadow-sm">
        {current.src ? (
          <Image
            src={current.src}
            alt={current.alt || productName}
            fill
            priority={active === 0}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain p-4 transition-transform duration-300 sm:p-8 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <ImageOff className="h-12 w-12 opacity-40" aria-hidden />
            <span className="text-sm">{t('imageNotAvailable')}</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" aria-hidden />
        <div className="absolute end-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 text-muted-foreground shadow-sm opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <ZoomIn className="h-4 w-4" aria-hidden />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2.5">
        {items.map((item, index) => {
          const isActive = index === active;
          return (
            <button
              key={index}
              type="button"
              onClick={() => setActive(index)}
              aria-label={t('imageLabel', { index: index + 1, name: productName })}
              aria-pressed={isActive}
              className={cn(
                'relative aspect-square overflow-hidden rounded-xl border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                isActive ? 'border-rose-500 shadow-sm shadow-rose-200' : 'border-border hover:border-rose-200',
              )}
            >
              {item.src ? (
                <Image
                  src={item.src}
                  alt={item.alt || productName}
                  fill
                  loading="lazy"
                  sizes="(max-width: 768px) 25vw, 80px"
                  className="object-cover"
                />
              ) : (
                <ImageOff className="relative h-6 w-6 text-muted-foreground/60" aria-hidden />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
