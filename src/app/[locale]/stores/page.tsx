import type { Metadata } from 'next';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { ArrowUpRight, MapPin, Package, Search, ShieldCheck, Store } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';
import { getSellerRepository } from '@/server/infrastructure/registry';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { Container } from '@/components/layout/container';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> };

const copy = {
  fa: {
    title: 'فروشگاه‌ها', subtitle: 'فروشگاه‌های تأییدشده را پیدا کنید و محصولات هر فروشنده را مستقیم ببینید.',
    placeholder: 'نام فروشگاه را جستجو کنید…', search: 'جستجو', results: 'فروشگاه', verified: 'فروشنده تأییدشده',
    products: 'محصول', location: 'موقعیت ثبت‌شده', open: 'مشاهده فروشگاه', empty: 'فروشگاهی پیدا نشد',
    emptyText: 'نام فروشگاه یا عبارت دیگری را جستجو کنید.', clear: 'حذف جستجو', localTitle: 'بازار فروشندگان',
    localText: 'فروشگاه‌های تأییدشده و محصولات واقعی فروشندگان را در یک مسیر ساده بررسی کنید.', trust: 'تأیید فروشنده',
  },
  ps: {
    title: 'پلورنځي', subtitle: 'تایید شوي پلورنځي ومومئ او د هر پلورونکي محصولات مستقیم وګورئ.',
    placeholder: 'د پلورنځي نوم ولټوئ…', search: 'لټون', results: 'پلورنځي', verified: 'تایید شوی پلورونکی',
    products: 'محصولات', location: 'ثبت شوی ځای', open: 'پلورنځی وګورئ', empty: 'هېڅ پلورنځی ونه موندل شو',
    emptyText: 'بل نوم یا کلیمه وکاروئ.', clear: 'لټون پاک کړئ', localTitle: 'د پلورونکو بازار',
    localText: 'تایید شوي پلورونکي او د هغوی ریښتیني محصولات په یوه ساده لاره ومومئ.', trust: 'د پلورونکي تایید',
  },
  en: {
    title: 'Stores', subtitle: 'Discover verified stores and browse each seller’s products directly.',
    placeholder: 'Search by store name…', search: 'Search', results: 'stores', verified: 'Verified seller',
    products: 'products', location: 'Registered location', open: 'View store', empty: 'No stores found',
    emptyText: 'Try another store name or keyword.', clear: 'Clear search', localTitle: 'Seller marketplace',
    localText: 'Explore verified sellers and real products with a focused storefront experience.', trust: 'Seller verified',
  },
} as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const lang = locale === 'en' || locale === 'ps' ? locale : 'fa';
  return { title: `${copy[lang].title} | Eshop`, description: copy[lang].subtitle };
}

export default async function StoresPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { q = '' } = await searchParams;
  setRequestLocale(locale);
  const lang = locale === 'en' || locale === 'ps' ? locale : 'fa';
  const t = copy[lang];
  const result = await getSellerRepository().findPublicMany({ q: q.trim(), page: 1, pageSize: 48 });
  const stores = result.items;
  const numberLocale = locale === 'en' ? 'en-US' : locale === 'ps' ? 'ps-AF' : 'fa-IR';
  const localePath = (path: string) => `/${locale}${path}`;

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main id="main" className="pb-20 md:pb-0">
        <Container size="xl" className="py-6 sm:py-8 lg:py-10">
          <header className="mb-7 overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
            <div className="relative p-5 sm:p-7 lg:p-8">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary/[0.08] to-transparent" />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden />{t.localTitle}
                  </div>
                  <h1 className="text-2xl font-black tracking-tight sm:text-4xl">{t.title}</h1>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{t.subtitle}</p>
                  <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-bold text-muted-foreground">
                    <span className="rounded-full border border-border bg-background px-3 py-1.5">{t.trust}</span>
                    <span className="rounded-full border border-border bg-background px-3 py-1.5">{t.localTitle}</span>
                  </div>
                </div>
                <form action={localePath('/stores')} method="get" className="w-full max-w-xl">
                  <div className="flex gap-2">
                    <div className="relative min-w-0 flex-1">
                      <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                      <input name="q" defaultValue={q} placeholder={t.placeholder} aria-label={t.placeholder} className="h-12 w-full rounded-2xl border border-border bg-background px-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" />
                    </div>
                    <button type="submit" className="h-12 shrink-0 rounded-2xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:opacity-90">{t.search}</button>
                  </div>
                </form>
              </div>
            </div>
          </header>

          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold text-muted-foreground">{result.total.toLocaleString(numberLocale)} {t.results}</span>
            {q ? <Link href="/stores" className="text-xs font-bold text-primary hover:underline">{t.clear}</Link> : null}
          </div>

          {stores.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-20 text-center">
              <Store className="mx-auto h-10 w-10 text-muted-foreground/40" aria-hidden />
              <h2 className="mt-4 text-lg font-black">{t.empty}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t.emptyText}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {stores.map((store) => {
                const storeHref = `/store/${store.id}`;
                return (
                  <article key={store.id} className="group min-w-0 overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
                    <Link href={storeHref} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset">
                      <div className="relative aspect-[3.2/1] overflow-hidden bg-muted">
                        {store.bannerUrl ? <Image src={store.bannerUrl} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : <div className="h-full w-full bg-gradient-to-br from-primary/15 via-muted to-muted" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                      </div>
                      <div className="px-4 pb-4">
                        <div className="-mt-6 flex items-center gap-3">
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border-2 border-card bg-background shadow-md">
                            {store.logoUrl ? <Image src={store.logoUrl} alt={store.shopName} fill sizes="48px" className="object-cover" /> : <div className="flex h-full w-full items-center justify-center bg-primary text-sm font-black text-primary-foreground">{store.shopName.charAt(0)}</div>}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h2 className="truncate text-sm font-black group-hover:text-primary">{store.shopName}</h2>
                            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"><ShieldCheck className="h-2.5 w-2.5" aria-hidden />{t.verified}</span>
                          </div>
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" aria-hidden />
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1 rounded-xl border border-border bg-background px-2.5 py-2"><Package className="h-3 w-3" aria-hidden />{store.productCount} {t.products}</span>
                          {store.city ? <span className="inline-flex min-w-0 items-center gap-1 rounded-xl border border-border bg-background px-2.5 py-2"><MapPin className="h-3 w-3 shrink-0" aria-hidden /><span className="truncate">{store.city}</span></span> : <span className="rounded-xl border border-border bg-background px-2.5 py-2">{t.location}</span>}
                        </div>
                        {store.bio ? <p className="mt-3 line-clamp-2 text-[11px] leading-5 text-muted-foreground">{store.bio}</p> : null}
                        <div className="mt-4 text-xs font-bold text-primary">{t.open} ←</div>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </Container>
      </main>
      <SiteFooter />
      <BottomNavigation />
    </div>
  );
}
