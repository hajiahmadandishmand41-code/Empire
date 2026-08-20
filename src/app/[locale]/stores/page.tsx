import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Store, MapPin, Package } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';
import { getSellerRepository } from '@/server/infrastructure/registry';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { Container } from '@/components/layout/container';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const title = locale === 'en' ? 'Stores | Eshop' : locale === 'ps' ? 'پلورنځي | Eshop' : 'فروشگاه‌ها | Eshop';
  const description = locale === 'en' ? 'Discover verified Eshop stores and shop products from individual sellers.' : locale === 'ps' ? 'د Eshop تایید شوي پلورنځي وګورئ او د هر پلورونکي محصولات واخلئ.' : 'فروشگاه‌های تأییدشده Eshop را ببینید و محصولات هر فروشنده را مستقیم مرور کنید.';
  return { title, description };
}

export default async function StoresPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { q = '' } = await searchParams;
  setRequestLocale(locale);

  const result = await getSellerRepository().findPublicMany({ q, page: 1, pageSize: 48 });
  const stores = result.items;
  const copy = locale === 'en'
    ? { title: 'Stores', subtitle: 'Explore verified sellers and open each store to see only their products.', placeholder: 'Search stores…', results: 'stores', empty: 'No stores found', emptyText: 'Try another store name, city, or keyword.', verified: 'Verified seller', products: 'products', open: 'Open store' }
    : locale === 'ps'
      ? { title: 'پلورنځي', subtitle: 'تایید شوي پلورونکي وګورئ او د هر پلورنځي ټول محصولات ومومئ.', placeholder: 'پلورنځي ولټوئ…', results: 'پلورنځي', empty: 'هېڅ پلورنځی ونه موندل شو', emptyText: 'بل نوم، ښار یا کلیمه وکاروئ.', verified: 'تایید شوی پلورونکی', products: 'محصولات', open: 'پلورنځي ته لاړ شئ' }
      : { title: 'فروشگاه‌ها', subtitle: 'فروشندگان تأییدشده را ببینید و با ورود به هر فروشگاه، فقط محصولات همان فروشنده را مرور کنید.', placeholder: 'جستجوی فروشگاه…', results: 'فروشگاه', empty: 'فروشگاهی پیدا نشد', emptyText: 'نام فروشگاه، شهر یا عبارت دیگری را جستجو کنید.', verified: 'فروشنده تأییدشده', products: 'محصول', open: 'ورود به فروشگاه' };

  const localePath = (path: string) => `/${locale}${path}`;

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main id="main" className="pb-20 md:pb-0">
        <Container size="xl" className="py-6 sm:py-8 lg:py-10">
          <header className="mb-6 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary"><Store className="h-3.5 w-3.5" aria-hidden />{copy.verified}</div>
                <h1 className="text-2xl font-black tracking-tight sm:text-4xl">{copy.title}</h1>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{copy.subtitle}</p>
              </div>
              <form action={localePath('/stores')} method="get" className="flex w-full max-w-xl gap-2 lg:w-auto lg:min-w-[420px]">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <input name="q" defaultValue={q} placeholder={copy.placeholder} aria-label={copy.placeholder} className="h-11 w-full rounded-xl border border-border bg-background px-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
                </div>
                <button type="submit" className="h-11 shrink-0 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">{copy.title}</button>
              </form>
            </div>
          </header>

          <div className="mb-5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>{result.total.toLocaleString(locale === 'en' ? 'en-US' : 'fa-IR')} {copy.results}</span>
            {q ? <Link href={localePath('/stores')} className="font-bold text-primary">{locale === 'en' ? 'Clear search' : locale === 'ps' ? 'لټون پاک کړه' : 'حذف جستجو'}</Link> : null}
          </div>

          {stores.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-20 text-center">
              <Store className="mx-auto h-10 w-10 text-muted-foreground/40" aria-hidden />
              <h2 className="mt-4 text-lg font-black">{copy.empty}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{copy.emptyText}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {stores.map((store) => {
                const href = localePath(`/store/${store.id}`);
                return (
                  <article key={store.id} className="group overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
                    <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset">
                      <div className="relative aspect-[2.6/1] overflow-hidden bg-muted">
                        {store.bannerUrl ? <Image src={store.bannerUrl} alt={`${store.shopName} banner`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" /> : <div className="h-full w-full bg-gradient-to-br from-primary/20 via-muted to-muted" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                      </div>
                      <div className="relative px-4 pb-4">
                        <div className="-mt-8 flex items-end gap-3">
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-4 border-card bg-background shadow-md">
                            {store.logoUrl ? <Image src={store.logoUrl} alt={store.shopName} fill sizes="64px" className="object-cover" /> : <div className="flex h-full w-full items-center justify-center bg-primary text-lg font-black text-primary-foreground">{store.shopName.charAt(0)}</div>}
                          </div>
                          <div className="min-w-0 flex-1 pb-1"><h2 className="truncate text-base font-black group-hover:text-primary">{store.shopName}</h2><span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{copy.verified}</span></div>
                        </div>
                        {store.bio ? <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">{store.bio}</p> : <div className="mt-3 min-h-10" />}
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><Package className="h-3.5 w-3.5" aria-hidden />{store.productCount} {copy.products}</span>
                          {store.city || store.country ? <span className="inline-flex min-w-0 items-center gap-1"><MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden /><span className="truncate">{[store.city, store.country].filter(Boolean).join(', ')}</span></span> : null}
                        </div>
                        <div className="mt-4 rounded-xl border border-border bg-muted/30 px-3 py-2 text-center text-xs font-bold text-foreground transition group-hover:border-primary/30 group-hover:bg-primary/5 group-hover:text-primary">{copy.open}</div>
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
