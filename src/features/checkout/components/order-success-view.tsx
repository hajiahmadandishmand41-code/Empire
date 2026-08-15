'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Home, ShoppingBag } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import type { Order } from '@/types';
import { readLastOrder } from '../hooks/use-order-storage';

interface OrderSuccessViewProps {
  locale: string;
}

/**
 * OrderSuccessView — post-submit confirmation.
 * Reads the last confirmed order from sessionStorage (written only after
 * a successful API response). If none exists (e.g. direct deep-link),
 * shows a generic thank-you without order details.
 */
export function OrderSuccessView({ locale }: OrderSuccessViewProps) {
  const t = useTranslations('orderSuccess');
  const [order, setOrder] = React.useState<Order | null>(null);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setOrder(readLastOrder());
    setHydrated(true);
  }, []);

  /**
   * Compute the grand total: subtotal + shipping cost.
   * The server stores shipping separately in `shippingCost`; the
   * `summary.subtotal` field carries only the items subtotal.
   */
  function grandTotal(o: Order): number {
    return o.summary.subtotal + (o.shippingCost ?? 0);
  }

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-border/70 bg-card p-8 text-center shadow-sm sm:p-12">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
        <CheckCircle2 className="h-9 w-9" aria-hidden />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-bold tracking-tight text-navy-800 sm:text-3xl">
          {t('title')}
        </h1>
        <p className="max-w-md text-sm text-muted-foreground sm:text-base">{t('subtitle')}</p>
      </div>

      {hydrated && order ? (
        <dl className="grid w-full max-w-sm grid-cols-2 gap-3 rounded-xl border border-border/70 bg-cream/40 p-4 text-start text-sm">
          <dt className="text-muted-foreground">{t('reference')}</dt>
          <dd className="num-ltr text-end font-semibold text-navy-800">{order.reference}</dd>
          <dt className="text-muted-foreground">{t('total')}</dt>
          <dd className="num-ltr text-end font-semibold text-navy-800">
            {formatPrice(grandTotal(order), order.summary.currency, locale)}
          </dd>
          <dt className="text-muted-foreground">{t('paymentMethod')}</dt>
          <dd className="text-end font-medium text-navy-800">
            {t(`paymentMethods.${order.paymentMethod}`)}
          </dd>
        </dl>
      ) : null}

      <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        <Button asChild variant="gold" size="lg" className="gap-2">
          <Link href="/">
            <Home className="h-4 w-4" aria-hidden />
            <span>{t('backHome')}</span>
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="gap-2">
          <Link href="/shop">
            <ShoppingBag className="h-4 w-4" aria-hidden />
            <span>{t('continueShopping')}</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
