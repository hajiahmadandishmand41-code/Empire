'use client';

import { useTranslations } from 'next-intl';
import { ShoppingCart, ArrowRight, ShoppingBag, Lock, Tag, Package, ChevronUp } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Stack } from '@/components/layout/stack';
import { formatPrice } from '@/lib/utils';
import { useCartStore, selectCartTotal } from '../store/cart-store';
import { useHydratedCartItems } from '../hooks/use-hydrated-cart';
import { CartLine } from './cart-line';
import { WhatsAppSellerCta } from './whatsapp-seller-cta';

interface CartViewProps { locale: string; currency?: string; }

export function CartView({ locale, currency = 'AFN' }: CartViewProps) {
  const t = useTranslations('cart');
  const { items, hydrated } = useHydratedCartItems();
  const total = useCartStore(selectCartTotal);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  if (!hydrated) return <div aria-hidden className="grid gap-4 lg:grid-cols-[1fr_360px]"><div className="h-64 animate-pulse rounded-2xl border border-border bg-card shadow-sm" /><div className="h-64 animate-pulse rounded-2xl border border-border bg-card shadow-sm" /></div>;
  if (items.length === 0) return <EmptyCart />;

  return (
    <>
      <div className="grid gap-5 pb-24 lg:grid-cols-[1fr_360px] lg:items-start lg:pb-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-sm"><div className="flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary"><ShoppingCart className="h-3.5 w-3.5" aria-hidden /></div><span className="text-sm font-semibold text-foreground">{t('title')}</span></div><span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{t('itemCount', { count: itemCount })}</span></div>
          <ul className="space-y-2.5">{items.map((item) => <CartLine key={item.slug} item={item} locale={locale} currency={currency} />)}</ul>
        </div>

        <aside aria-label={t('summary')} className="sticky top-20 hidden space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm lg:block">
          <h2 className="text-base font-semibold text-foreground">{t('summary')}</h2>
          <OrderSummary t={t} total={total} currency={currency} locale={locale} />
          <CheckoutButton t={t} />
          <Button asChild variant="outline" size="sm" className="w-full rounded-xl text-xs gap-2 border-border text-muted-foreground hover:text-foreground"><Link href="/shop"><span>{t('continueShopping')}</span><ArrowRight className="icon-directional h-3.5 w-3.5" aria-hidden /></Link></Button>
          <WhatsAppSellerCta />
          <TrustRow t={t} />
        </aside>
      </div>

      <div className="fixed inset-x-3 bottom-3 z-40 lg:hidden">
        <details className="overflow-hidden rounded-2xl border border-border bg-card/95 shadow-2xl backdrop-blur-xl">
          <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden"><div className="min-w-0 flex-1"><div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground"><span>{t('itemCount', { count: itemCount })}</span><span aria-hidden>•</span><span>{t('summary')}</span></div><div className="mt-0.5 text-base font-black num-ltr text-foreground">{formatPrice(total, currency, locale)}</div></div><span className="flex h-9 items-center gap-1 rounded-xl bg-primary px-4 text-xs font-black text-primary-foreground">{t('goToCheckout')}<ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden /></span><ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden /></summary>
          <div className="border-t border-border p-4"><OrderSummary t={t} total={total} currency={currency} locale={locale} /><div className="mt-3"><CheckoutButton t={t} /></div><div className="mt-2"><WhatsAppSellerCta /></div><div className="mt-3"><TrustRow t={t} /></div></div>
        </details>
      </div>
    </>
  );
}

function OrderSummary({ t, total, currency, locale }: { t: ReturnType<typeof useTranslations<'cart'>>; total: number; currency: string; locale: string }) {
  return <div className="space-y-3 text-sm"><div className="flex items-center justify-between text-muted-foreground"><span className="flex items-center gap-1.5"><Package className="h-3.5 w-3.5" aria-hidden />{t('subtotal')}</span><span className="num-ltr font-medium text-foreground">{formatPrice(total, currency, locale)}</span></div><div className="flex items-center justify-between text-muted-foreground"><span className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" aria-hidden />{t('shipping')}</span><span className="text-xs font-semibold text-emerald-600">{t('shippingHint')}</span></div><div className="border-t border-border pt-3"><div className="flex items-center justify-between"><span className="font-bold text-foreground">{t('total')}</span><span className="num-ltr text-xl font-black text-price-current">{formatPrice(total, currency, locale)}</span></div></div></div>;
}
function CheckoutButton({ t }: { t: ReturnType<typeof useTranslations<'cart'>> }) { return <Button asChild size="lg" className="w-full gap-2 rounded-xl btn-primary-premium"><Link href="/checkout"><Lock className="h-4 w-4" aria-hidden /><span>{t('goToCheckout')}</span></Link></Button>; }
function TrustRow({ t }: { t: ReturnType<typeof useTranslations<'cart'>> }) { return <div className="flex items-center justify-center gap-3 border-t border-border pt-3 text-[10px] text-muted-foreground"><div className="flex items-center gap-1"><Lock className="h-3 w-3" aria-hidden /><span>{t('trustPayment')}</span></div><span aria-hidden className="text-border">•</span><div className="flex items-center gap-1"><ShoppingBag className="h-3 w-3" aria-hidden /><span>{t('trustAuthentic')}</span></div></div>; }
function EmptyCart() { const t = useTranslations('cart'); return <Stack gap="6" align="center" className="py-16 text-center"><div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-muted to-muted/60 ring-1 ring-border"><ShoppingBag className="h-11 w-11 text-muted-foreground/40" aria-hidden /></div><div className="space-y-2"><h3 className="text-lg font-bold text-foreground">{t('empty.title')}</h3><p className="text-sm text-muted-foreground max-w-xs mx-auto">{t('empty.description')}</p></div><Button asChild size="lg" className="gap-2 rounded-xl btn-primary-premium px-8"><Link href="/shop">{t('viewShop')}<ArrowRight className="icon-directional h-4 w-4" aria-hidden /></Link></Button></Stack>; }
