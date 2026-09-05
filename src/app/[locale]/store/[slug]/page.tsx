import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { decodeRouteParam } from '@/lib/url-params';
import { cache } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { Link } from '@/i18n/routing';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { Container } from '@/components/layout/container';
import { ArrowRight, ExternalLink, MapPin, Package, ShieldCheck, Sparkles, Star, Store, Tag } from 'lucide-react';
import { StoreProductSearch } from '@/features/store/components/store-product-search';

type Props = { params: Promise<{ locale: string; slug: string }> };
type ProductImage = { src?: string; url?: string };

const copy = {
  fa: {
    verified: 'تأییدشده', store: 'فروشگاه', reviews: 'نظر', products: 'محصول', location: 'موقعیت',
    categories: 'دسته‌های این فروشگاه', popular: 'پرفروش‌ترین‌ها', newest: 'جدیدترین محصولات',
    newestText: 'تازه‌ترین کالاهای فعال این فروشگاه', offers: 'پیشنهادهای فروشگاه', offersText: 'محصولات دارای قیمت ویژه',
    traditional: 'محصولات سنتی و اصیل', traditionalText: 'کالاهایی که فروشنده به‌عنوان محصول سنتی علامت‌گذاری کرده است.',
    all: 'همه محصولات فروشگاه', allText: 'فقط محصولات همین فروشگاه را جستجو و مرور کنید.',
    item: 'مورد', openWhatsapp: 'تماس در واتساپ', website: 'وب‌سایت فروشگاه', local: 'فروشنده محلی', trust: 'فروشنده تأییدشده',
    back: 'بازگشت به فروشگاه‌ها', noBio: 'این فروشنده هنوز توضیحات فروشگاه را تکمیل نکرده است.', unavailable: 'اتصال پایگاه داده برای این پیش‌نمایش هنوز تنظیم نشده است.',
  },
  ps: {
    verified: 'تایید شوی', store: 'پلورنځی', reviews: 'کتنې', products: 'محصولات', location: 'ځای',
    categories: 'د پلورنځي وېشنیزې', popular: 'ډېر پلورل شوي', newest: 'نوي محصولات',
    newestText: 'د دې پلورنځي تازه فعال محصولات', offers: 'د پلورنځي وړاندیزونه', offersText: 'محصولات په ځانګړې بیه',
    traditional: 'عنـعنوي او اصلي محصولات', traditionalText: 'هغه توکي چې پلورونکي د عنعنوي محصول په توګه نښه کړي دي.',
    all: 'د پلورنځي ټول محصولات', allText: 'یوازې د دې پلورنځي محصولات ولټوئ او وګورئ.',
    item: 'مورد', openWhatsapp: 'په واټساپ اړیکه', website: 'د پلورنځي وېب‌پاڼه', local: 'محلي پلورونکی', trust: 'تایید شوی پلورونکی',
    back: 'بېرته پلورنځیو ته', noBio: 'دې پلورونکي لا تر اوسه د پلورنځي معلومات نه دي بشپړ کړي.', unavailable: 'د دې مخکتنې لپاره د ډیټابېس پیوستون لا نه دی برابر شوی.',
  },
  en: {
    verified: 'Verified', store: 'Store', reviews: 'reviews', products: 'products', location: 'Location',
    categories: 'Store categories', popular: 'Best sellers', newest: 'New arrivals',
    newestText: 'Recently added active products from this store', offers: 'Store offers', offersText: 'Products with a special price',
    traditional: 'Traditional & heritage products', traditionalText: 'Products explicitly marked by the seller as traditional.',
    all: 'All store products', allText: 'Search and browse products from this store only.',
    item: 'items', openWhatsapp: 'Contact on WhatsApp', website: 'Store website', local: 'Local seller', trust: 'Verified seller',
    back: 'Back to stores', noBio: 'This seller has not completed the store description yet.', unavailable: 'The database is not configured for this preview yet.',
  },
} as const;

function slugify(value: string): string { return value.trim().toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, ''); }

const getSeller = cache(async (slug: string) => {
  const seller = await prisma.user.findFirst({
    where: { role: 'seller', sellerStatus: 'approved', isActive: true, OR: [{ id: slug }, { sellerShopName: { equals: slug, mode: 'insensitive' } }] },
    select: { id: true, fullName: true, sellerShopName: true, sellerBio: true, sellerLogoUrl: true, sellerBannerUrl: true, sellerCity: true, sellerCountry: true, sellerWhatsapp: true, sellerWebsite: true },
  });
  if (seller || !slug) return seller;
  const candidates = await prisma.user.findMany({ where: { role: 'seller', sellerStatus: 'approved', isActive: true, sellerShopName: { not: null } }, select: { id: true, sellerShopName: true }, take: 500 });
  const match = candidates.find((candidate) => candidate.sellerShopName ? slugify(candidate.sellerShopName) === slug : false);
  if (!match) return null;
  return prisma.user.findUnique({ where: { id: match.id }, select: { id: true, fullName: true, sellerShopName: true, sellerBio: true, sellerLogoUrl: true, sellerBannerUrl: true, sellerCity: true, sellerCountry: true, sellerWhatsapp: true, sellerWebsite: true } });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug: rawSlug } = await params;
  const slug = decodeRouteParam(rawSlug);
  if (!isDatabaseConfigured()) return { title: locale === 'en' ? 'Store | Eshop' : locale === 'ps' ? 'پلورنځی | Eshop' : 'فروشگاه | Eshop' };
  const seller = await getSeller(slug);
  if (!seller) return { title: locale === 'en' ? 'Store | Eshop' : locale === 'ps' ? 'پلورنځی | Eshop' : 'فروشگاه | Eshop' };
  const name = seller.sellerShopName ?? seller.fullName;
  return { title: `${name} | Eshop`, description: seller.sellerBio ?? `${name} — Eshop storefront` };
}

export default async function SellerStorefront({ params }: Props) {
  const { locale, slug: rawSlug } = await params;
  const slug = decodeRouteParam(rawSlug);
  setRequestLocale(locale);
  const lang = locale === 'en' || locale === 'ps' ? locale : 'fa';
  const t = copy[lang];
  if (!isDatabaseConfigured()) {
    return <div className="min-h-dvh bg-background"><SiteHeader /><main className="mx-auto max-w-screen-xl px-3 py-16 sm:px-6"><div className="rounded-3xl border border-amber-300/40 bg-amber-50/60 px-6 py-16 text-center text-sm font-semibold text-amber-900 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-200">{t.unavailable}</div></main><SiteFooter /></div>;
  }
  const seller = await getSeller(slug);
  if (!seller) notFound();

  const [products, categories, activeCount, reviewAgg] = await Promise.all([
    prisma.product.findMany({ where: { sellerId: seller.id, isActive: true }, include: { category: true }, orderBy: [{ salesCount: 'desc' }, { createdAt: 'desc' }], take: 60 }),
    prisma.category.findMany({ where: { products: { some: { sellerId: seller.id, isActive: true } } }, select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' }, take: 30 }),
    prisma.product.count({ where: { sellerId: seller.id, isActive: true } }),
    prisma.review.aggregate({ where: { product: { sellerId: seller.id }, isApproved: true }, _avg: { rating: true }, _count: { _all: true } }),
  ]);
  type StoreProductRow = (typeof products)[number];

  const averageRating = reviewAgg._avg.rating ?? 0;
  const location = [seller.sellerCity, seller.sellerCountry].filter(Boolean).join(', ');
  const popular = products.slice(0, 8);
  const newest = [...products].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 8);
  const offers = products.filter((product) => product.compareAtPrice && product.compareAtPrice.toNumber() > product.price.toNumber()).slice(0, 8);
  const traditional = products.filter((product) => product.isTraditional).slice(0, 8);
  const toCard = (product: StoreProductRow) => {
    const images = Array.isArray(product.imagesJson) ? (product.imagesJson as ProductImage[]) : [];
    const image = images[product.primaryImageIndex] ?? images[0] ?? null;
    return { id: product.id, name: product.name, price: Number(product.price), imageUrl: image?.src ?? image?.url ?? null, categoryName: product.category.name };
  };
  const cardSet = (items: StoreProductRow[]) => items.map(toCard);
  const name = seller.sellerShopName ?? seller.fullName;
  const numberLocale = locale === 'en' ? 'en-US' : locale === 'ps' ? 'ps-AF' : 'fa-IR';

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main id="main">
        <section className="relative overflow-hidden border-b border-border bg-muted/30">
          <div className="relative h-52 w-full sm:h-72 lg:h-80">
            {seller.sellerBannerUrl ? <Image src={seller.sellerBannerUrl} alt={`${name} banner`} fill className="object-cover" priority sizes="100vw" /> : <div className="h-full w-full bg-gradient-to-br from-primary via-emerald-700 to-slate-950" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
            <Link href="/stores" className="absolute start-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/30 px-3 py-2 text-xs font-bold text-white backdrop-blur hover:bg-black/45"><ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />{t.back}</Link>
          </div>
          <Container size="xl" className="relative -mt-16 pb-7 sm:-mt-20"><div className="flex flex-col gap-4 sm:flex-row sm:items-end"><div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-3xl border-4 border-background bg-card shadow-xl">{seller.sellerLogoUrl ? <Image src={seller.sellerLogoUrl} alt={name} fill className="object-cover" sizes="112px" /> : <div className="flex h-full w-full items-center justify-center bg-primary text-4xl font-black text-primary-foreground">{name.charAt(0)}</div>}</div><div className="min-w-0 flex-1 rounded-3xl bg-background/90 p-4 shadow-lg backdrop-blur sm:p-5"><div className="flex flex-wrap items-center gap-2"><Store className="h-5 w-5 text-primary" aria-hidden /><h1 className="truncate text-2xl font-black sm:text-3xl">{name}</h1><span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"><ShieldCheck className="h-3.5 w-3.5" aria-hidden />{t.verified}</span>{seller.sellerCountry === 'Afghanistan' || seller.sellerCountry === 'افغانستان' ? <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{t.local}</span> : null}</div><div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />{averageRating.toFixed(1)}</span><span>{reviewAgg._count._all.toLocaleString(numberLocale)} {t.reviews}</span><span className="inline-flex items-center gap-1"><Package className="h-4 w-4" aria-hidden />{activeCount.toLocaleString(numberLocale)} {t.products}</span>{location ? <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" aria-hidden />{location}</span> : null}</div><p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">{seller.sellerBio ?? t.noBio}</p><div className="mt-4 flex flex-wrap gap-2">{seller.sellerWhatsapp ? <a href={`https://wa.me/${seller.sellerWhatsapp.replace(/[^\d+]/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90">{t.openWhatsapp}</a> : null}{seller.sellerWebsite ? <a href={seller.sellerWebsite} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-bold hover:border-primary/30 hover:text-primary">{t.website}<ExternalLink className="h-3.5 w-3.5" aria-hidden /></a> : null}</div></div></div></Container>
        </section>

        <section className="sticky top-0 z-30 border-b border-border bg-background/95 py-2 backdrop-blur" aria-labelledby="store-categories"><Container size="xl"><div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"><span id="store-categories" className="shrink-0 px-1 text-xs font-black text-primary">{t.categories}</span>{categories.map((category) => <Link key={category.id} href={`/category/${category.slug}`} className="shrink-0 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold transition hover:border-primary/40 hover:bg-primary/5">{category.name}</Link>)}</div></Container></section>

        <Container size="xl" className="py-8 sm:py-10">
          {traditional.length > 0 ? <section className="mb-10 rounded-3xl border border-primary/15 bg-primary/[0.04] p-4 sm:p-5" aria-labelledby="traditional-products"><div className="mb-4 flex items-start justify-between gap-3"><div><div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background px-3 py-1.5 text-[11px] font-bold text-primary"><Tag className="h-3.5 w-3.5" aria-hidden />{t.traditional}</div><h2 id="traditional-products" className="text-xl font-black">{t.traditional}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{t.traditionalText}</p></div><span className="text-xs font-bold text-primary">{traditional.length.toLocaleString(numberLocale)} {t.item}</span></div><StoreProductSearch products={cardSet(traditional)} locale={locale} /></section> : null}
          {popular.length > 0 ? <section className="mb-10" aria-labelledby="popular-products"><div className="mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" aria-hidden /><h2 id="popular-products" className="text-xl font-black">{t.popular}</h2></div><StoreProductSearch products={cardSet(popular)} locale={locale} /></section> : null}
          {newest.length > 0 ? <section className="mb-10" aria-labelledby="newest-products"><div className="mb-4"><h2 id="newest-products" className="text-xl font-black">{t.newest}</h2><p className="mt-1 text-sm text-muted-foreground">{t.newestText}</p></div><StoreProductSearch products={cardSet(newest)} locale={locale} /></section> : null}
          {offers.length > 0 ? <section className="mb-10" aria-labelledby="store-offers"><div className="mb-4"><h2 id="store-offers" className="text-xl font-black">{t.offers}</h2><p className="mt-1 text-sm text-muted-foreground">{t.offersText}</p></div><StoreProductSearch products={cardSet(offers)} locale={locale} /></section> : null}
          <section aria-labelledby="all-store-products"><div className="mb-5 flex items-end justify-between gap-3"><div><h2 id="all-store-products" className="text-xl font-black">{t.all}</h2><p className="mt-1 text-sm text-muted-foreground">{t.allText}</p></div><div className="text-xs font-semibold text-muted-foreground">{products.length.toLocaleString(numberLocale)} / {activeCount.toLocaleString(numberLocale)} {t.item}</div></div><StoreProductSearch products={cardSet(products)} locale={locale} /></section>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
