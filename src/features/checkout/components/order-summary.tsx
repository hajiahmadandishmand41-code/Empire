import { useTranslations } from 'next-intl';
import { Package, ShieldCheck } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import type { CartLineBase } from '@/types';

interface OrderSummaryProps {
  items: CartLineBase[];
  summary: { subtotal: number; shipping: number; total: number };
  locale: string;
  currency?: string;
}

export function OrderSummary({ items, summary, locale, currency = 'AFN' }: OrderSummaryProps) {
  const t = useTranslations('checkout.summary');

  return (
    <section
      aria-label={t('title')}
      className="sticky top-20 rounded-2xl border border-border bg-card shadow-sm p-5 shadow-xs"
    >
      <h2 className="mb-4 text-sm font-semibold text-foreground">{t('title')}</h2>

      {/* Items list */}
      <ul className="mb-4 space-y-3">
        {items.map((item) => {
          const lineTotal = item.price * item.quantity;
          return (
            <li key={item.slug} className="flex items-start gap-3">
              {/* Thumbnail */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                <Package className="h-4 w-4 text-muted-foreground" aria-hidden />
              </div>
              <div className="flex flex-1 min-w-0 items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-foreground">{item.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {t('qty', { count: item.quantity })} ·{' '}
                    <span className="num-ltr">{formatPrice(item.price, currency, locale)}</span>
                  </p>
                </div>
                <p className="shrink-0 text-xs font-semibold text-foreground num-ltr">
                  {formatPrice(lineTotal, currency, locale)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Totals */}
      <div className="space-y-2 border-t border-border pt-4 text-sm">
        <Row label={t('subtotal')}>
          <span className="num-ltr">{formatPrice(summary.subtotal, currency, locale)}</span>
        </Row>
        <Row label={t('shipping')}>
          <span className={cn('num-ltr', summary.shipping === 0 ? 'text-emerald-600 font-medium text-xs' : '')}>
            {summary.shipping === 0 ? 'رایگان' : formatPrice(summary.shipping, currency, locale)}
          </span>
        </Row>
        <div className="border-t border-border pt-2.5">
          <Row label={<span className="font-semibold text-foreground">{t('total')}</span>} large>
            <span className="num-ltr text-base font-bold text-red-500">
              {formatPrice(summary.total, currency, locale)}
            </span>
          </Row>
        </div>
      </div>

      {/* Trust */}
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
        <ShieldCheck className="h-4 w-4 shrink-0 text-rose-500" aria-hidden />
        <span className="text-[11px] text-muted-foreground">پرداخت امن و رمزگذاری شده</span>
      </div>
    </section>
  );
}

function Row({
  label, children, large,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  large?: boolean;
}) {
  return (
    <div className={cn('flex items-center justify-between', large ? 'text-foreground' : 'text-muted-foreground')}>
      <span>{label}</span>
      <span>{children}</span>
    </div>
  );
}
