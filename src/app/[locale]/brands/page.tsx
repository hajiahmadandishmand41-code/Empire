import Image from 'next/image';
import { BadgeCheck, Search, Tags } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Container } from '@/components/layout/container';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { getSellerRepository } from '@/server/infrastructure/registry';

type Locale = 'fa' | 'ps' | 'en';
const copy = {
  fa: { title: 'برندها', subtitle: 'هر فروشگاه با هویت برند خودش در ایشاپ دیده می‌شود.', placeholder: 'نام برند یا فروشگاه را جستجو کنید…', empty: 'برندی پیدا نشد.', brand: 'برند', unavailable: 'برندها موقتاً در دسترس نیستند.', retry: 'اتصال به پایگاه داده برقرار نشد؛ لطفاً بعداً دوباره تلاش کنید.' },
  ps: { title: 'برانډونه', subtitle: 'هر پلورنځی په ایشاپ کې خپل برانډي هویت لري.', placeholder: 'د برانډ یا پلورنځي نوم ولټوئ…', empty: 'هیڅ برانډ ونه موندل شو.', brand: 'برانډ', unavailable: 'برانډونه اوس مهال د لاسرسي وړ نه دي.', retry: 'له ډیټابیس سره اړیکه ونه شوه؛ مهرباني وکړئ وروسته بیا هڅه وکړئ.' },
  en: { title: 'Brands', subtitle: 'Every store is presented with its own brand identity on Eshop.', placeholder: 'Search a brand or store…', empty: 'No brands found.', brand: 'Brand', unavailable: 'Brands are temporarily unavailable.', retry: 'The database could not be reached. Please try again later.' },
} as const;

export const dynamic = 'force-dynamic';

async function BrandsGrid({ locale, query }: { locale: Locale; query: string }) {
  const t = copy[locale];
  try {
    const result = await getSellerRepository().findPublicMany({ q: query, page: 1, pageSize: 48 });
    if (!result.items.length) return <div className="py-16 text-center text-sm font-semibold text-muted-foreground">{t.empty}</div>;
    return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">{result.items.map((store) => <Link key={store.id} href={`/store/${store.id}` as never} className="group rounded-3xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"><div className="flex flex-col items-center text-center"><span className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-border bg-background shadow-sm ring-2 ring-background">{store.logoUrl ? <Image src={store.logoUrl} alt="" fill sizes="80px" className="object-cover" /> : <span className="text-2xl font-black text-primary">{store.shopName.charAt(0)}</span>}<span className="absolute -end-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-background bg-emerald-500 text-white"><BadgeCheck className="h-3 w-3" /></span></span><h2 className="mt-3 w-full truncate text-sm font-black group-hover:text-primary">{store.shopName}</h2><span className="mt-1 text-[10px] font-semibold text-muted-foreground">{t.brand}</span></div></Link>)}</div>;
  } catch (err) {
    console.error('[brands] DB error:', err);
    return <div role="status" className="rounded-3xl border border-amber-500/30 bg-amber-500/5 px-6 py-20 text-center"><Tags className="mx-auto h-10 w-10 text-amber-600" aria-hidden /><h2 className="mt-4 text-lg font-black">{t.unavailable}</h2><p className="mt-2 text-sm text-muted-foreground">{t.retry}</p></div>;
  }
}

export default async function BrandsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (['fa', 'ps', 'en'].includes(rawLocale) ? rawLocale : 'fa') as Locale;
  const { q = '' } = await searchParams;
  setRequestLocale(locale);
  const t = copy[locale];
  return <div className="min-h-dvh bg-background"><SiteHeader /><main className="pb-20 md:pb-0"><section className="border-b border-border bg-gradient-to-b from-primary/[0.08] to-background py-8 sm:py-12"><Container size="xl"><div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Tags className="h-6 w-6" /></span><div><h1 className="text-3xl font-black tracking-tight sm:text-4xl">{t.title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t.subtitle}</p></div></div><form action="" className="mt-6 flex max-w-xl items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm" role="search"><Search className="ms-2 h-5 w-5 text-muted-foreground" /><input name="q" defaultValue={q} placeholder={t.placeholder} className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none" /></form></Container></section><section className="py-8 sm:py-10"><Container size="xl"><BrandsGrid locale={locale} query={q} /></Container></section></main><SiteFooter /><BottomNavigation /></div>;
}
