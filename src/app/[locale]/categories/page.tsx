import { ArrowLeft } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { CategoriesMarketplace, type MarketplaceCategory } from '@/features/home/components/categories-marketplace';
import { getCategoryRepository, getProductService } from '@/server/infrastructure/registry';

const categoryTitles: Record<string, string> = {
  clothing: 'پوشاک', digital: 'موبایل و دیجیتال', homeAppliances: 'خانه و آشپزخانه', beauty: 'بهداشت و زیبایی',
  sports: 'ورزش', footwear: 'کفش و کیف', baby: 'کودک و نوزاد', books: 'کتاب و آموزش', electronics: 'لوازم الکترونیکی', watches: 'ساعت و اکسسوری',
};

function localizedTitle(key: string, name: string, locale: string): string {
  if (locale === 'en') {
    const english: Record<string, string> = { clothing: 'Clothing', digital: 'Mobile & Digital', homeAppliances: 'Home & Kitchen', beauty: 'Beauty & Care', sports: 'Sports', footwear: 'Footwear & Bags', baby: 'Baby & Kids', books: 'Books & Learning', electronics: 'Electronics', watches: 'Watches & Accessories' };
    return english[key] ?? name;
  }
  if (locale === 'ps') {
    const pashto: Record<string, string> = { clothing: 'جامې', digital: 'موبایل او ډیجیټل', homeAppliances: 'کور او پخلنځی', beauty: 'روغتیا او ښکلا', sports: 'ورزش', footwear: 'بوټان او بکسونه', baby: 'ماشومان', books: 'کتابونه او زده کړه', electronics: 'برېښنایي وسایل', watches: 'ساعتونه او لوازم' };
    return pashto[key] ?? name;
  }
  return categoryTitles[key] ?? name;
}

export default async function CategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  let categories: MarketplaceCategory[] = [];
  try {
    const raw = await getCategoryRepository().findAll(true);
    const productService = getProductService();
    categories = await Promise.all(raw.map(async (category) => {
      const title = localizedTitle(category.key, category.name, locale);
      const preview = await productService.listProducts({ categoryKey: category.key, page: 1, pageSize: 1, sort: 'popular', isActive: true }).catch(() => ({ products: [] }));
      return {
        key: category.key,
        slug: category.slug,
        name: category.name,
        productCount: category.productCount,
        title,
        image: preview.products[0]?.images?.find((image) => image.src)?.src ?? '',
      };
    }));
  } catch (error) {
    console.error('[categories-page] category catalog unavailable', error);
  }

  const brand = locale === 'en' ? 'Eshop' : 'ایشاپ';
  const title = locale === 'en' ? 'All categories' : locale === 'ps' ? 'ټولې کټګورۍ' : 'همه دسته‌بندی‌ها';
  const subtitle = locale === 'en' ? `Explore every ${brand} category and move directly into the right marketplace shelf.` : locale === 'ps' ? `د ${brand} ټولې کټګورۍ وګورئ او مستقیم د اړوند بازار برخې ته لاړ شئ.` : `همه دسته‌های ${brand} را ببینید و مستقیم وارد قفسه محصولات مرتبط شوید.`;
  const placeholder = locale === 'en' ? 'Search categories…' : locale === 'ps' ? 'کټګورۍ ولټوئ…' : 'جستجوی دسته‌ها…';
  const allLabel = locale === 'en' ? 'All' : locale === 'ps' ? 'ټولې' : 'همه';
  const back = locale === 'en' ? 'Back to home' : locale === 'ps' ? 'بېرته کور ته' : 'بازگشت به خانه';

  return <div className="min-h-dvh bg-background">
    <SiteHeader />
    <main id="main" className="pb-16 md:pb-0">
      <section className="border-b border-border bg-card"><div className="mx-auto max-w-screen-xl px-3 py-7 sm:px-6 sm:py-10"><Link href="/" className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary"><ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />{back}</Link><h1 className="text-2xl font-black tracking-tight text-foreground sm:text-4xl">{title}</h1><p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">{subtitle}</p></div></section>
      <section className="mx-auto max-w-screen-xl px-3 py-6 sm:px-6 sm:py-8"><CategoriesMarketplace categories={categories} locale={locale} placeholder={placeholder} allLabel={allLabel} /></section>
    </main>
    <SiteFooter />
    <BottomNavigation />
  </div>;
}
