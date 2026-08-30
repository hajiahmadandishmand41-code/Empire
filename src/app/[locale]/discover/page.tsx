import { Suspense } from 'react';
import { Compass, PackagePlus, Sparkles, Tag, Store } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { TraditionalProductsBanner } from '@/features/home/components/traditional-products-banner';
import { BrandsSection } from '@/features/home/components/brands-section';
import { DiscoverProductSection, DiscoverUnavailable, Recommendations, TrustedStores } from './discover-sections';

type Locale = 'fa' | 'ps' | 'en';

function copy(locale: Locale) {
  if (locale === 'en') return { eyebrow: 'Marketplace discovery', title: 'Find your next purchase faster', subtitle: 'Explore deals, new arrivals, trusted stores and local products without scrolling through everything.', explore: 'Browse all products', deals: 'Deals', new: 'New arrivals', stores: 'Stores', brands: 'Brands', local: 'Local products' };
  if (locale === 'ps') return { eyebrow: 'د بازار کشف', title: 'خپل راتلونکی پیرود ژر ومومئ', subtitle: 'ځانګړي وړاندیزونه، نوي محصولات، باوري پلورنځي او کورني محصولات په اسانه ومومئ.', explore: 'ټول محصولات وګورئ', deals: 'ځانګړي وړاندیزونه', new: 'نوي محصولات', stores: 'پلورنځي', brands: 'برانډونه', local: 'کورني محصولات' };
  return { eyebrow: 'کشف بازار', title: 'خرید بعدی‌تان را سریع‌تر پیدا کنید', subtitle: 'پیشنهادها، تازه‌واردها، فروشگاه‌های معتبر و محصولات وطنی را بدون گشتن در یک صفحه طولانی پیدا کنید.', explore: 'مشاهده همه محصولات', deals: 'پیشنهادها', new: 'تازه‌واردها', stores: 'فروشگاه‌ها', brands: 'برندها', local: 'محصولات وطنی' };
}

function DiscoveryLinks({ locale }: { locale: Locale }) {
  const t = copy(locale);
  const items = [
    { href: '/shop?badge=sale', label: t.deals, icon: Tag, tone: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    { href: '/shop?sort=newest', label: t.new, icon: PackagePlus, tone: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
    { href: '#stores', label: t.stores, icon: Store, tone: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
    { href: '/brands', label: t.brands, icon: Store, tone: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400' },
    { href: '/traditional', label: t.local, icon: Sparkles, tone: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  ];
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{items.map(({ href, label, icon: Icon, tone }) => <Link key={href} href={href as never} className="group rounded-2xl border border-border bg-card p-4 shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" aria-hidden /></span><p className="mt-3 text-sm font-extrabold text-foreground">{label}</p></Link>)}</div>;
}

function SectionSkeleton() { return <div className="mx-auto my-6 h-40 max-w-screen-xl animate-pulse rounded-3xl bg-muted/40" aria-hidden />; }

export const dynamic = 'force-dynamic';

export default async function DiscoverPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (['fa', 'ps', 'en'].includes(rawLocale) ? rawLocale : 'fa') as Locale;
  setRequestLocale(locale);
  const t = copy(locale);
  return <div className="min-h-dvh bg-background"><SiteHeader /><main id="main" className="pb-16 md:pb-0"><section className="border-b border-border bg-card"><div className="mx-auto max-w-screen-xl px-3 py-10 sm:px-6 sm:py-14 lg:py-16"><div className="max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-[10px] font-extrabold text-primary"><Compass className="h-3.5 w-3.5" aria-hidden />{t.eyebrow}</span><h1 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-5xl">{t.title}</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{t.subtitle}</p><Link href="/shop" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5">{t.explore}</Link></div></div></section><section className="mx-auto max-w-screen-xl px-3 py-5 sm:px-6 sm:py-7"><DiscoveryLinks locale={locale} /></section><Suspense fallback={<SectionSkeleton />}><DiscoverProductSection section="featured" locale={locale} title={locale === 'en' ? 'Today’s picks' : locale === 'ps' ? 'د نن غوره انتخابونه' : 'انتخاب‌های امروز'} subtitle={locale === 'en' ? 'Focused products worth checking first' : locale === 'ps' ? 'هغه محصولات چې لومړی یې وګورئ' : 'محصولاتی که بهتر است اول ببینید'} href="/shop?badge=sale" badge="featured" accentColor="bg-rose-500" /></Suspense><Suspense fallback={<SectionSkeleton />}><DiscoverProductSection section="bestSelling" locale={locale} title={locale === 'en' ? 'Best sellers' : locale === 'ps' ? 'تر ټولو ډېر پلورل شوي' : 'پرفروش‌ترین‌ها'} subtitle={locale === 'en' ? 'Popular choices across the marketplace' : locale === 'ps' ? 'په بازار کې مشهور انتخابونه' : 'انتخاب‌های محبوب در سراسر بازار'} href="/shop?sort=bestSelling" badge="best" accentColor="bg-amber-500" /></Suspense><Suspense fallback={<SectionSkeleton />}><TrustedStores locale={locale} /></Suspense><Suspense fallback={<SectionSkeleton />}><BrandsSection locale={locale} /></Suspense><Suspense fallback={<SectionSkeleton />}><DiscoverProductSection section="newest" locale={locale} title={locale === 'en' ? 'Fresh arrivals' : locale === 'ps' ? 'تازه راغلي محصولات' : 'تازه‌واردها'} subtitle={locale === 'en' ? 'New products to explore' : locale === 'ps' ? 'نوي محصولات د کتلو لپاره' : 'محصولات جدید برای کشف'} href="/shop?sort=newest" badge="new" accentColor="bg-sky-500" /></Suspense><Suspense fallback={<SectionSkeleton />}><DiscoverProductSection section="popular" locale={locale} title={locale === 'en' ? 'Popular right now' : locale === 'ps' ? 'اوسني مشهور محصولات' : 'محبوب این روزها'} subtitle={locale === 'en' ? 'What shoppers are checking most' : locale === 'ps' ? 'هغه څه چې پیرودونکي یې ډېر ګوري' : 'چیزهایی که خریداران بیشتر می‌بینند'} href="/shop?sort=popular" badge="popular" accentColor="bg-fuchsia-500" /></Suspense><Suspense fallback={<SectionSkeleton />}><TraditionalProductsBanner locale={locale} /></Suspense><Suspense fallback={<SectionSkeleton />}><Recommendations locale={locale} /></Suspense></main><SiteFooter /><BottomNavigation /></div>;
}
