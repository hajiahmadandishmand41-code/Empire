import { ArrowLeft } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { CategoriesMarketplace, type MarketplaceCategory } from '@/features/home/components/categories-marketplace';
import { getCategoryRepository } from '@/server/infrastructure/registry';

type CategoryCopy = { title: string; image: string };

const categoryCopy: Record<string, CategoryCopy> = {
  clothing: { title: 'پوشاک', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=82' },
  digital: { title: 'موبایل و دیجیتال', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=82' },
  homeAppliances: { title: 'خانه و آشپزخانه', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=900&q=82' },
  beauty: { title: 'بهداشت و زیبایی', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=82' },
  sports: { title: 'ورزش', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=82' },
  footwear: { title: 'کفش و کیف', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=82' },
  baby: { title: 'کودک و نوزاد', image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=900&q=82' },
  books: { title: 'کتاب و آموزش', image: 'https://images.unsplash.com/photo-1526243741027-444d633d7365?auto=format&fit=crop&w=900&q=82' },
  electronics: { title: 'لوازم الکترونیکی', image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&w=900&q=82' },
  watches: { title: 'ساعت و اکسسوری', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=82' },
};

function localizedTitle(key: string, name: string, locale: string): string {
  const fallback = categoryCopy[key]?.title ?? name;
  if (locale === 'en') {
    const english: Record<string, string> = { clothing: 'Clothing', digital: 'Mobile & Digital', homeAppliances: 'Home & Kitchen', beauty: 'Beauty & Care', sports: 'Sports', footwear: 'Footwear & Bags', baby: 'Baby & Kids', books: 'Books & Learning', electronics: 'Electronics', watches: 'Watches & Accessories' };
    return english[key] ?? name;
  }
  if (locale === 'ps') {
    const pashto: Record<string, string> = { clothing: 'جامې', digital: 'موبایل او ډیجیټل', homeAppliances: 'کور او پخلنځی', beauty: 'روغتیا او ښکلا', sports: 'ورزش', footwear: 'بوټان او بکسونه', baby: 'ماشومان', books: 'کتابونه او زده کړه', electronics: 'برېښنایي وسایل', watches: 'ساعتونه او لوازم' };
    return pashto[key] ?? name;
  }
  return fallback;
}

export default async function CategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const raw = await getCategoryRepository().findAll(true);
  const categories: MarketplaceCategory[] = raw.map((category) => ({
    key: category.key,
    slug: category.slug,
    name: category.name,
    productCount: category.productCount,
    title: localizedTitle(category.key, category.name, locale),
    image: categoryCopy[category.key]?.image ?? 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=82',
  }));

  const title = locale === 'en' ? 'All categories' : locale === 'ps' ? 'ټولې کټګورۍ' : 'همه دسته‌بندی‌ها';
  const subtitle = locale === 'en' ? 'Explore every Eshop category, compare products and move directly into the right marketplace shelf.' : locale === 'ps' ? 'د Eshop ټولې کټګورۍ وګورئ او مستقیم د اړوند بازار برخې ته لاړ شئ.' : 'همه دسته‌های Eshop را ببینید و مستقیم وارد قفسه محصولات مرتبط شوید.';
  const placeholder = locale === 'en' ? 'Search categories…' : locale === 'ps' ? 'کټګورۍ ولټوئ…' : 'جستجوی دسته‌ها…';
  const allLabel = locale === 'en' ? 'All' : locale === 'ps' ? 'ټولې' : 'همه';
  const back = locale === 'en' ? 'Back to home' : locale === 'ps' ? 'بېرته کور ته' : 'بازگشت به خانه';

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main id="main" className="pb-16 md:pb-0">
        <section className="border-b border-border bg-card">
          <div className="mx-auto max-w-screen-xl px-3 py-7 sm:px-6 sm:py-10">
            <Link href="/" className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary"><ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />{back}</Link>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-4xl">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">{subtitle}</p>
          </div>
        </section>
        <section className="mx-auto max-w-screen-xl px-3 py-6 sm:px-6 sm:py-8">
          <CategoriesMarketplace categories={categories} locale={locale} placeholder={placeholder} allLabel={allLabel} />
        </section>
      </main>
      <SiteFooter />
      <BottomNavigation />
    </div>
  );
}
