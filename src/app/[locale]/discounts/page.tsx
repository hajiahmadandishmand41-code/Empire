import type { Metadata } from 'next';
import { Percent } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { Container } from '@/components/layout/container';
import { MarketplaceProductCard } from '@/components/marketplace-product-card';
import { getProductService } from '@/server/infrastructure/registry';
import { isDatabaseConfigured } from '@/lib/db';
import type { ProductSummary } from '@/types';

export const dynamic = 'force-dynamic';

interface Props { params: Promise<{ locale: string }> }
type DiscountState = { status: 'ok'; products: ProductSummary[] } | { status: 'unavailable'; products: [] };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === 'en' ? '20%+ Discounts | Eshop' : locale === 'ps' ? '۲۰٪+ تخفیفونه | Eshop' : 'تخفیف‌های ۲۰٪ به بالا | ایشاپ',
    description: locale === 'en' ? 'Products with more than 20% real discount.' : locale === 'ps' ? 'هغه محصولات چې ریښتینی تخفیف یې له ۲۰٪ څخه زیات وي.' : 'محصولاتی که تخفیف واقعی آن‌ها بیشتر از ۲۰٪ باشد.',
  };
}

async function getDiscountedProducts(): Promise<DiscountState> {
  if (!isDatabaseConfigured()) return { status: 'unavailable', products: [] };
  try {
    // One bounded catalog query instead of the previous 20-page sequential waterfall.
    const result = await getProductService().listProducts({ hasDiscount: true, sort: 'newest', page: 1, pageSize: 100 });
    const products = result.products.filter((product) => {
      const original = product.comparePrice ?? null;
      const price = product.price;
      return original !== null && original > price && ((original - price) / original) * 100 > 20;
    });
    return { status: 'ok', products };
  } catch {
    return { status: 'unavailable', products: [] };
  }
}

export default async function DiscountsPage({ params }: Props) {
  const { locale: rawLocale } = await params;
  const locale = ['fa', 'ps', 'en'].includes(rawLocale) ? rawLocale : 'fa';
  setRequestLocale(locale);
  const state = await getDiscountedProducts();
  const copy = locale === 'en'
    ? { title: '20%+ discounts', subtitle: 'Only products with more than 20% real discount are shown here.', empty: 'No products with more than 20% discount were found.', unavailable: 'The database is not configured for this preview yet.' }
    : locale === 'ps'
      ? { title: '۲۰٪+ تخفیفونه', subtitle: 'یوازې هغه محصولات دلته ښکاري چې ریښتینی تخفیف یې له ۲۰٪ څخه زیات وي.', empty: 'له ۲۰٪ څخه زیات تخفیف لرونکي محصولات ونه موندل شول.', unavailable: 'د دې مخکتنې لپاره د ډیټابېس پیوستون لا نه دی برابر شوی.' }
      : { title: 'تخفیف‌های ۲۰٪ به بالا', subtitle: 'فقط محصولاتی اینجا نمایش داده می‌شوند که تخفیف واقعی آن‌ها بیشتر از ۲۰٪ باشد.', empty: 'محصولی با تخفیف بیشتر از ۲۰٪ پیدا نشد.', unavailable: 'اتصال پایگاه داده برای این پیش‌نمایش هنوز تنظیم نشده است.' };
  const products = state.status === 'ok' ? state.products : [];

  return <div className="min-h-dvh bg-background"><SiteHeader /><main id="main" className="pb-16 md:pb-0"><section className="border-b border-border bg-gradient-to-br from-rose-50 via-white to-amber-50 py-8 dark:from-rose-950/30 dark:via-background dark:to-amber-950/20 sm:py-12"><Container size="xl"><div className="flex items-start gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-500/20"><Percent className="h-6 w-6" /></span><div><h1 className="text-2xl font-black tracking-tight sm:text-4xl">{copy.title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{copy.subtitle}</p></div></div></Container></section><section className="py-7 sm:py-10"><Container size="xl">{state.status === 'unavailable' ? <div className="rounded-3xl border border-amber-300/40 bg-amber-50/60 px-6 py-16 text-center text-sm font-semibold text-amber-900 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-200">{copy.unavailable}</div> : products.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">{products.map((product) => <MarketplaceProductCard key={product.id} product={product} locale={locale} currency="AFN" view="grid" />)}</div> : <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground">{copy.empty}</div>}</Container></section></main><SiteFooter /><BottomNavigation /></div>;
}
