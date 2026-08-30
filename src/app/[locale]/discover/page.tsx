import { Suspense } from 'react';
import Image from 'next/image';
import { Compass, Tag, PackagePlus, Store, Sparkles, ArrowLeft, ShieldCheck, MapPin, Package, BadgeCheck } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { ProductSliderSection } from '@/features/home/components/product-slider-section';
import { PersonalizedProductsSection, RecentlyViewedSection } from '@/features/home/components/personalized-products-section';
import { TraditionalProductsBanner } from '@/features/home/components/traditional-products-banner';
import { BrandsSection } from '@/features/home/components/brands-section';
import { getHomepageData, getHomepageSection, toSliderProduct } from '@/features/home/lib/homepage-data';
import { getSellerRepository } from '@/server/infrastructure/registry';
import { isDatabaseConfigured } from '@/lib/db';

type Locale = 'fa' | 'ps' | 'en';

function copy(locale: Locale) {
  if (locale === 'en') return { eyebrow: 'Marketplace discovery', title: 'Find your next purchase faster', subtitle: 'Explore deals, new arrivals, trusted stores and local products without scrolling through everything.', explore: 'Browse all products', deals: 'Deals', new: 'New arrivals', stores: 'Stores', brands: 'Brands', local: 'Local products', storesTitle: 'Explore trusted stores', storesSubtitle: 'Meet verified sellers and open their storefronts directly.', viewStores: 'View all stores', verified: 'Verified seller', products: 'products', unavailable: 'The database is not configured for this preview yet.' };
  if (locale === 'ps') return { eyebrow: 'د بازار کشف', title: 'خپل راتلونکی پیرود ژر ومومئ', subtitle: 'ځانګړي وړاندیزونه، نوي محصولات، باوري پلورنځي او کورني محصولات په اسانه ومومئ.', explore: 'ټول محصولات وګورئ', deals: 'ځانګړي وړاندیزونه', new: 'نوي محصولات', stores: 'پلورنځي', brands: 'برانډونه', local: 'کورني محصولات', storesTitle: 'باوري پلورنځي وپلټئ', storesSubtitle: 'تایید شوي پلورونکي ومومئ او د هغوی پلورنځي مستقیم خلاص کړئ.', viewStores: 'ټول پلورنځي وګورئ', verified: 'تایید شوی پلورونکی', products: 'محصولات', unavailable: 'د دې مخکتنې لپاره د ډیټابېس پیوستون لا نه دی برابر شوی.' };
  return { eyebrow: 'کشف بازار', title: 'خرید بعدی‌تان را سریع‌تر پیدا کنید', subtitle: 'پیشنهادها، تازه‌واردها، فروشگاه‌های معتبر و محصولات وطنی را بدون گشتن در یک صفحه طولانی پیدا کنید.', explore: 'مشاهده همه محصولات', deals: 'پیشنهادها', new: 'تازه‌واردها', stores: 'فروشگاه‌ها', brands: 'برندها', local: 'محصولات وطنی', storesTitle: 'فروشگاه‌های معتبر را کشف کنید', storesSubtitle: 'فروشندگان تأییدشده را ببینید و مستقیم وارد فروشگاهشان شوید.', viewStores: 'مشاهده همه فروشگاه‌ها', verified: 'فروشنده تأییدشده', products: 'محصول', unavailable: 'اتصال پایگاه داده برای این پیش‌نمایش هنوز تنظیم نشده است.' };
}

function DiscoveryLinks({ locale }: { locale: Locale }) {
  const t = copy(locale);
  const items = [
    { href: '/shop?badge=sale', label: t.deals, icon: Tag, tone: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    { href: '/shop?sort=newest', label: t.new, icon: PackagePlus, tone: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
    { href: '#stores', label: t.stores, icon: Store, tone: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
    { href: '/brands', label: t.brands, icon: BadgeCheck, tone: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400' },
    { href: '/traditional', label: t.local, icon: Sparkles, tone: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  ];
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{items.map(({ href, label, icon: Icon, tone }) => <Link key={href} href={href as never} className="group rounded-2xl border border-border bg-card p-4 shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" aria-hidden /></span><p className="mt-3 text-sm font-extrabold text-foreground">{label}</p><ArrowLeft className="mt-2 h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-x-1 rtl:rotate-180" aria-hidden /></Link>)}</div>;
}

function DiscoverSkeleton() { return <div className="mx-auto my-6 h-56 max-w-screen-xl animate-pulse rounded-3xl bg-muted/40" aria-hidden />; }
function DatabaseUnavailable({ locale }: { locale: Locale }) { return <div className="mx-auto my-6 max-w-screen-xl px-3 sm:px-6"><div className="rounded-3xl border border-amber-300/40 bg-amber-50/60 px-6 py-12 text-center text-sm font-semibold text-amber-900 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-200">{copy(locale).unavailable}</div></div>; }

async function DiscoverProductSection({ section, locale, title, subtitle, href, badge, accentColor }: { section: 'featured' | 'bestSelling' | 'newest' | 'popular'; locale: Locale; title: string; subtitle: string; href: string; badge: string; accentColor: string }) {
  if (!isDatabaseConfigured()) return <DatabaseUnavailable locale={locale} />;
  try {
    const products = await getHomepageSection(section, 12);
    if (!products.length) return null;
    return <ProductSliderSection title={title} subtitle={subtitle} viewAllHref={href} products={products.map((product) => toSliderProduct(product, badge))} locale={locale} accentColor={accentColor} />;
  } catch {
    return <DatabaseUnavailable locale={locale} />;
  }
}

async function TrustedStores({ locale }: { locale: Locale }) {
  const t = copy(locale);
  if (!isDatabaseConfigured()) return <DatabaseUnavailable locale={locale} />;
  try {
    const result = await getSellerRepository().findPublicMany({ q: '', page: 1, pageSize: 4 });
    if (!result.items.length) return null;
    return (
      <section id="stores" aria-labelledby="stores-title" className="mx-auto max-w-screen-xl px-3 py-6 sm:px-6 sm:py-9">
        <div className="mb-5 flex items-end justify-between gap-3"><div><div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1.5 text-[10px] font-extrabold text-violet-600 dark:text-violet-400"><Store className="h-3.5 w-3.5" aria-hidden />{t.stores}</div><h2 id="stores-title" className="mt-3 text-xl font-black tracking-tight sm:text-2xl">{t.storesTitle}</h2><p className="mt-1 text-xs leading-6 text-muted-foreground sm:text-sm">{t.storesSubtitle}</p></div><div className="flex shrink-0 items-center gap-2"><Link href="/stores" className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-muted-foreground transition hover:border-primary/25 hover:text-primary">{t.viewStores}<ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden /></Link><Link href="/brands" className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2 text-xs font-bold text-primary transition hover:bg-primary/10"><BadgeCheck className="h-3.5 w-3.5" aria-hidden />{t.brands}</Link></div></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">{result.items.map((store) => <Link key={store.id} href={`/store/${store.id}` as never} className="group min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"><div className="relative aspect-[2.8/1] overflow-hidden bg-muted">{store.bannerUrl ? <Image src={store.bannerUrl} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : <div className="h-full w-full bg-gradient-to-br from-violet-500/15 via-muted to-muted" />}</div><div className="p-3"><div className="flex items-center gap-2.5"><div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-border bg-background">{store.logoUrl ? <Image src={store.logoUrl} alt={store.shopName} fill sizes="40px" className="object-cover" /> : <div className="flex h-full w-full items-center justify-center bg-primary text-xs font-black text-primary-foreground">{store.shopName.charAt(0)}</div>}</div><div className="min-w-0"><h3 className="truncate text-sm font-black group-hover:text-primary">{store.shopName}</h3><span className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400"><ShieldCheck className="h-3 w-3" aria-hidden />{t.verified}</span></div></div><div className="mt-3 flex gap-2 text-[9px] text-muted-foreground"><span className="inline-flex min-w-0 items-center gap-1 rounded-lg border border-border bg-background px-2 py-1.5"><Package className="h-3 w-3 shrink-0" aria-hidden />{store.productCount} {t.products}</span>{store.city ? <span className="inline-flex min-w-0 items-center gap-1 rounded-lg border border-border bg-background px-2 py-1.5"><MapPin className="h-3 w-3 shrink-0" aria-hidden /><span className="truncate">{store.city}</span></span> : null}</div></div></Link>)}</div>
      </section>
    );
  } catch {
    return <DatabaseUnavailable locale={locale} />;
  }
}

async function Recommendations({ locale }: { locale: Locale }) {
  if (!isDatabaseConfigured()) return <DatabaseUnavailable locale={locale} />;
  try {
    const data = await getHomepageData();
    const seen = new Set<string>();
    const pool = [...data.featured, ...data.bestSelling, ...data.newest, ...data.popular].filter((product) => !seen.has(product.id) && seen.add(product.id)).slice(0, 12).map((product) => toSliderProduct(product));
    if (!pool.length) return null;
    return <><PersonalizedProductsSection products={pool} locale={locale} /><RecentlyViewedSection products={pool} locale={locale} /></>;
  } catch {
    return <DatabaseUnavailable locale={locale} />;
  }
}

export const dynamic = 'force-dynamic';

export default async function DiscoverPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (['fa', 'ps', 'en'].includes(rawLocale) ? rawLocale : 'fa') as Locale;
  setRequestLocale(locale);
  const t = copy(locale);

  return <div className="min-h-dvh bg-background"><SiteHeader /><main id="main" className="pb-16 md:pb-0"><section className="border-b border-border bg-card"><div className="mx-auto max-w-screen-xl px-3 py-10 sm:px-6 sm:py-14 lg:py-16"><div className="max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-[10px] font-extrabold text-primary"><Compass className="h-3.5 w-3.5" aria-hidden />{t.eyebrow}</span><h1 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-5xl">{t.title}</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{t.subtitle}</p><Link href="/shop" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5">{t.explore}<ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden /></Link></div></div></section><section className="mx-auto max-w-screen-xl px-3 py-5 sm:px-6 sm:py-7"><DiscoveryLinks locale={locale} /></section><Suspense fallback={<DiscoverSkeleton />}><DiscoverProductSection section="featured" locale={locale} title={locale === 'en' ? 'Today’s picks' : locale === 'ps' ? 'د نن غوره انتخابونه' : 'انتخاب‌های امروز'} subtitle={locale === 'en' ? 'Focused products worth checking first' : locale === 'ps' ? 'هغه محصولات چې لومړی یې وګورئ' : 'محصولاتی که بهتر است اول ببینید'} href="/shop?badge=sale" badge="featured" accentColor="bg-rose-500" /></Suspense><Suspense fallback={<DiscoverSkeleton />}><DiscoverProductSection section="bestSelling" locale={locale} title={locale === 'en' ? 'Best sellers' : locale === 'ps' ? 'تر ټولو ډېر پلورل شوي' : 'پرفروش‌ترین‌ها'} subtitle={locale === 'en' ? 'Popular choices across the marketplace' : locale === 'ps' ? 'په بازار کې مشهور انتخابونه' : 'انتخاب‌های محبوب در سراسر بازار'} href="/shop?sort=bestSelling" badge="best" accentColor="bg-amber-500" /></Suspense><Suspense fallback={<DiscoverSkeleton />}><TrustedStores locale={locale} /></Suspense><Suspense fallback={<DiscoverSkeleton />}><BrandsSection locale={locale} /></Suspense><Suspense fallback={<DiscoverSkeleton />}><DiscoverProductSection section="newest" locale={locale} title={locale === 'en' ? 'Fresh arrivals' : locale === 'ps' ? 'تازه راغلي محصولات' : 'تازه‌واردها'} subtitle={locale === 'en' ? 'New products to explore' : locale === 'ps' ? 'نوي محصولات د کتلو لپاره' : 'محصولات جدید برای کشف'} href="/shop?sort=newest" badge="new" accentColor="bg-sky-500" /></Suspense><Suspense fallback={<DiscoverSkeleton />}><DiscoverProductSection section="popular" locale={locale} title={locale === 'en' ? 'Popular right now' : locale === 'ps' ? 'اوسني مشهور محصولات' : 'محبوب این روزها'} subtitle={locale === 'en' ? 'What shoppers are checking most' : locale === 'ps' ? 'هغه څه چې پیرودونکي یې ډېر ګوري' : 'چیزهایی که خریداران بیشتر می‌بینند'} href="/shop?sort=popular" badge="popular" accentColor="bg-fuchsia-500" /></Suspense><Suspense fallback={<DiscoverSkeleton />}><TraditionalProductsBanner locale={locale} /></Suspense><Suspense fallback={<DiscoverSkeleton />}><Recommendations locale={locale} /></Suspense></main><SiteFooter /><BottomNavigation /></div>;
}
