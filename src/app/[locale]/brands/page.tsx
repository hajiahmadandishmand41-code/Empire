import Image from 'next/image';
import { BadgeCheck, Search, Tags, Store } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';
import { Prisma } from '@prisma/client';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { Link } from '@/i18n/routing';
import { Container } from '@/components/layout/container';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';

type Locale = 'fa' | 'ps' | 'en';
type BrandListItem = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  shopName: string | null;
  sellerName: string;
  productCount: number;
};

const copy = {
  fa: { title: 'برندها', subtitle: 'هر فروشگاه یک برند اختصاصی دارد و هر برند صفحه مستقل خودش را دارد.', placeholder: 'نام برند یا فروشگاه را جستجو کنید…', empty: 'برندی پیدا نشد.', brand: 'برند اختصاصی', store: 'فروشگاه', unavailable: 'برندها موقتاً در دسترس نیستند.', retry: 'اتصال به پایگاه داده برقرار نشد؛ لطفاً بعداً دوباره تلاش کنید.' },
  ps: { title: 'برانډونه', subtitle: 'هر پلورنځی یو ځانګړی برانډ لري او هر برانډ خپله جلا پاڼه لري.', placeholder: 'د برانډ یا پلورنځي نوم ولټوئ…', empty: 'هیڅ برانډ ونه موندل شو.', brand: 'ځانګړی برانډ', store: 'پلورنځی', unavailable: 'برانډونه اوس مهال د لاسرسي وړ نه دي.', retry: 'له ډیټابیس سره اړیکه ونه شوه؛ مهرباني وکړئ وروسته بیا هڅه وکړئ.' },
  en: { title: 'Brands', subtitle: 'Every store has one dedicated brand with its own public page.', placeholder: 'Search a brand or store…', empty: 'No brands found.', brand: 'Dedicated brand', store: 'Store', unavailable: 'Brands are temporarily unavailable.', retry: 'The database could not be reached. Please try again later.' },
} as const;

export const dynamic = 'force-dynamic';

async function loadBrands(query: string): Promise<BrandListItem[] | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    const q = query.trim();
    const search = q
      ? Prisma.sql`AND (b."name" ILIKE ${`%${q}%`} OR u."sellerShopName" ILIKE ${`%${q}%`} OR u."fullName" ILIKE ${`%${q}%`})`
      : Prisma.empty;
    return await prisma.$queryRaw<BrandListItem[]>(Prisma.sql`
      SELECT b."id", b."slug", b."name", b."logoUrl", b."bannerUrl",
             u."sellerShopName" AS "shopName", u."fullName" AS "sellerName",
             (SELECT COUNT(*)::int FROM "Product" p WHERE p."sellerId" = b."sellerId" AND p."isActive" = true) AS "productCount"
      FROM "SellerBrand" b
      JOIN "User" u ON u."id" = b."sellerId"
      WHERE b."isActive" = true
        AND u."role" = 'seller'
        AND u."sellerStatus" = 'approved'
        AND u."isActive" = true
        ${search}
      ORDER BY b."name" ASC, b."createdAt" DESC
      LIMIT 48
    `);
  } catch (err) {
    console.error('[brands] DB error:', err);
    return null;
  }
}

function BrandCard({ brand, locale, label }: { brand: BrandListItem; locale: Locale; label: string }) {
  const productLabel = locale === 'en' ? 'products' : locale === 'ps' ? 'محصولات' : 'محصول';
  const numberLocale = locale === 'en' ? 'en-US' : locale === 'ps' ? 'ps-AF' : 'fa-IR';
  return (
    <Link
      href={`/brands/${brand.slug}` as never}
      className="group overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div className="relative h-20 overflow-hidden bg-muted">
        {brand.bannerUrl ? (
          <Image src={brand.bannerUrl} alt="" fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/10 via-background to-primary/5" />
        )}
      </div>
      <div className="relative px-4 pb-4">
        <span className="relative -mt-7 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-card bg-background shadow-md">
          {brand.logoUrl ? (
            <Image src={brand.logoUrl} alt={brand.name} fill sizes="64px" className="object-cover" />
          ) : (
            <span className="text-xl font-black text-primary">{brand.name.charAt(0)}</span>
          )}
        </span>
        <div className="mt-3">
          <h2 className="truncate text-sm font-black group-hover:text-primary">{brand.name}</h2>
          <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
            <Store className="h-3 w-3" />{brand.shopName ?? brand.sellerName}
          </span>
          <span className="mt-1 block text-[9px] text-muted-foreground">
            {brand.productCount.toLocaleString(numberLocale)} {productLabel}
          </span>
          <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
            <BadgeCheck className="h-3 w-3" />{label}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function BrandsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = (['fa', 'ps', 'en'].includes(rawLocale) ? rawLocale : 'fa') as Locale;
  const { q = '' } = await searchParams;
  setRequestLocale(locale);
  const t = copy[locale];
  const brands = await loadBrands(q);

  const body = brands === null ? (
    <div role="status" className="rounded-3xl border border-amber-500/30 bg-amber-500/5 px-6 py-20 text-center">
      <Tags className="mx-auto h-10 w-10 text-amber-600" aria-hidden />
      <h2 className="mt-4 text-lg font-black">{t.unavailable}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t.retry}</p>
    </div>
  ) : brands.length === 0 ? (
    <div className="py-16 text-center text-sm font-semibold text-muted-foreground">{t.empty}</div>
  ) : (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
      {brands.map((brand) => <BrandCard key={brand.id} brand={brand} locale={locale} label={t.brand} />)}
    </div>
  );

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="pb-20 md:pb-0">
        <section className="border-b border-border bg-gradient-to-b from-primary/[0.08] to-background py-8 sm:py-12">
          <Container size="xl">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Tags className="h-6 w-6" /></span>
              <div>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{t.title}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t.subtitle}</p>
              </div>
            </div>
            <form action="" className="mt-6 flex max-w-xl items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm" role="search">
              <Search className="ms-2 h-5 w-5 text-muted-foreground" />
              <input name="q" defaultValue={q} placeholder={t.placeholder} className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none" />
            </form>
          </Container>
        </section>
        <section className="py-8 sm:py-10">
          <Container size="xl">{body}</Container>
        </section>
      </main>
      <SiteFooter />
      <BottomNavigation />
    </div>
  );
}
