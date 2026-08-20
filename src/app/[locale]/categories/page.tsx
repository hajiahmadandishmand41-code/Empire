import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowLeft, LayoutGrid, Package } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { getCategoryRepository, getProductService } from '@/server/infrastructure/registry';

const names: Record<string, Record<string, string>> = {
  fa: {
    clothing: 'پوشاک', digital: 'موبایل و دیجیتال', homeAppliances: 'خانه و آشپزخانه', beauty: 'بهداشت و زیبایی', sports: 'ورزش', footwear: 'کفش و کیف', baby: 'کودک و نوزاد', books: 'کتاب و آموزش', electronics: 'لوازم الکترونیکی', watches: 'ساعت و اکسسوری',
  },
  ps: {
    clothing: 'جامې', digital: 'موبایل او ډیجیټل', homeAppliances: 'کور او پخلنځی', beauty: 'روغتیا او ښکلا', sports: 'ورزش', footwear: 'بوټان او بکسونه', baby: 'ماشومان', books: 'کتابونه او زده کړه', electronics: 'برېښنایي وسایل', watches: 'ساعتونه او لوازم',
  },
  en: {
    clothing: 'Clothing', digital: 'Mobile & Digital', homeAppliances: 'Home & Kitchen', beauty: 'Beauty & Care', sports: 'Sports', footwear: 'Footwear & Bags', baby: 'Baby & Kids', books: 'Books & Learning', electronics: 'Electronics', watches: 'Watches & Accessories',
  },
};

const copy = {
  fa: { title: 'دسته‌بندی‌ها', subtitle: 'دسته موردنظر را سریع پیدا کنید و مستقیماً وارد محصولات شوید.', back: 'بازگشت به خانه', count: 'محصول', view: 'مشاهده محصولات', all: 'همه دسته‌ها', note: 'برای کشف محصول، دسته را انتخاب کنید.' },
  ps: { title: 'وېشنیزې', subtitle: 'خپله اړونده وېشنیزه ژر پیدا کړئ او مستقیم محصولات وګورئ.', back: 'بېرته کور ته', count: 'محصولات', view: 'محصولات وګورئ', all: 'ټولې وېشنیزې', note: 'د محصول موندلو لپاره یوه وېشنیزه وټاکئ.' },
  en: { title: 'Categories', subtitle: 'Choose a category and move directly into the products you want.', back: 'Back to home', count: 'products', view: 'View products', all: 'All categories', note: 'Choose a category to start discovering products.' },
} as const;

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const lang = locale === 'en' || locale === 'ps' ? locale : 'fa';
  return { title: copy[lang].title, description: copy[lang].subtitle };
}

export default async function CategoriesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lang = locale === 'en' || locale === 'ps' ? locale : 'fa';

  const raw = await getCategoryRepository().findAll(true).catch(() => []);
  const productService = getProductService();
  const categories = await Promise.all(raw.map(async (category) => {
    const preview = await productService.listProducts({ categoryKey: category.key, page: 1, pageSize: 1, sort: 'popular', isActive: true }).catch(() => ({ products: [] }));
    return {
      ...category,
      title: names[lang][category.key] ?? category.name,
      image: preview.products[0]?.images?.find((image) => image.src)?.src ?? '',
    };
  }));

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main id="main" className="pb-20 md:pb-0">
        <div className="mx-auto max-w-screen-xl px-3 py-6 sm:px-6 sm:py-9">
          <div className="mb-6 flex items-center gap-3">
            <Link href="/" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-primary/30 hover:text-primary" aria-label={copy[lang].back}>
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </Link>
            <div className="min-w-0">
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{copy[lang].title}</h1>
              <p className="mt-1 text-xs leading-6 text-muted-foreground sm:text-sm">{copy[lang].subtitle}</p>
            </div>
          </div>

          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><LayoutGrid className="h-4 w-4" aria-hidden /></span>
            <span>{copy[lang].note}</span>
            <span className="ms-auto shrink-0 font-bold text-foreground">{categories.length} {lang === 'en' ? 'categories' : lang === 'ps' ? 'وېشنیزې' : 'دسته'}</span>
          </div>

          {categories.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card px-5 py-16 text-center text-sm text-muted-foreground">{copy[lang].all}</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {categories.map((category) => (
                <Link key={category.id} href={`/category/${category.slug}`} className="group flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:p-3.5">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-16 sm:w-16">
                    {category.image ? <Image src={category.image} alt={category.title} fill sizes="64px" className="object-cover transition-transform duration-300 group-hover:scale-105" /> : <div className="flex h-full w-full items-center justify-center text-primary/40"><Package className="h-6 w-6" aria-hidden /></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="line-clamp-2 text-sm font-black leading-5 group-hover:text-primary sm:text-[15px]">{category.title}</h2>
                    <p className="mt-1 text-[11px] font-semibold text-muted-foreground">{(category.productCount ?? 0).toLocaleString(lang === 'en' ? 'en-US' : 'fa-IR')} {copy[lang].count}</p>
                    <span className="mt-2 inline-block text-[10px] font-bold text-primary">{copy[lang].view} ←</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
      <BottomNavigation />
    </div>
  );
}
