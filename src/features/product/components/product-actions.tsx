'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { ShoppingCart, MessageCircle, Check, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/routing';
import { useCartStore } from '@/features/cart';
import { buildWhatsAppUrl, whatsappConfig } from '@/config/site';
import type { CategoryKey, ProductImage } from '@/types';

export type ProductCartSnapshot = {
  slug: string;
  name: string;
  price: number;
  region: string;
  categoryKey: CategoryKey;
  images: ProductImage[];
};

interface ProductActionsProps {
  productName: string;
  product: ProductCartSnapshot;
}

export function ProductActions({ productName, product }: ProductActionsProps) {
  const t = useTranslations('product.actions');
  const tCart = useTranslations('cart');
  const { toast } = useToast();
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = React.useState(false);

  function handleAddToCart() {
    addItem(product);
    setAdded(true);
    toast({
      title: t('addedToCart'),
      description: productName,
    });
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    addItem(product);
  }

  const whatsappUrl = whatsappConfig.enabled
    ? buildWhatsAppUrl(`${t('whatsappMessage')} ${productName}`)
    : null;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          size="lg"
          onClick={handleAddToCart}
          className={cn(
            'w-full gap-2 text-sm font-semibold shadow-sm transition-all',
            added
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'btn-primary-premium hover:shadow-md',
          )}
          aria-label={added ? t('addedToCart') : t('addToCart')}
        >
          {added ? (
            <>
              <Check className="h-5 w-5" aria-hidden />
              {t('addedToCart')}
            </>
          ) : (
            <>
              <ShoppingCart className="h-5 w-5" aria-hidden />
              {t('addToCart')}
            </>
          )}
        </Button>

        <Button asChild size="lg" className="w-full gap-2 bg-foreground text-background shadow-sm hover:bg-foreground/90">
          <Link href="/cart" onClick={handleBuyNow} aria-label={tCart('title')}>
            <Zap className="h-5 w-5" aria-hidden />
            {tCart('title')}
          </Link>
        </Button>
      </div>

      {whatsappUrl && (
        <Button
          asChild
          variant="outline"
          size="lg"
          className="w-full gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
        >
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-5 w-5" aria-hidden />
            {t('whatsapp')}
          </a>
        </Button>
      )}
    </div>
  );
}
