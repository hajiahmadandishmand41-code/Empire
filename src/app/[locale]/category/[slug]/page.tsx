import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Package, SlidersHorizontal } from 'lucide-react';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { ShopPageClient } from '@/features/shop';
import { getCategoryRepository, getProductService } from '@/server/infrastructure/registry';
import { getProductLocalizedTexts, normalizeCatalogLocale } from '@/server/localization/product-localization';

type Props = { params: Promise<{ locale: string; slug: string }> };
type FallbackCategory = { key: string; name: string; slug: string; productCount: number };

const fallbackCategories: Record<string, FallbackCategory> = {
  digital: { key: 'digital', name: 'موبایل و دیجیتال', slug: 'digital', productCount: 0 },
  clothing: { key: 'clothing', name: 'پوشاک', slug: 'clothing', productCount: 0 },
  homeAppliances: { key: 'homeAppliances', name: 'خانه و آشپزخانه', slug: 'homeAppliances', productCount: 0 },
  beauty: { key: 'beauty', name: 'بهداشت و زیبایی', slug: 'beauty', productCount: 0 },
  sports: { key: 'sports', name: 'ورزش', slug: 'sports', productCount: 0 },
  footwear: { key: 'footwear', name: 'کفش و کیف', slug: 'footwear', productCount: 0 },
  baby: { key: 'baby', name: 'کودک و نوزاد', slug: 'baby', productCount: 0 },
  books: { key: 'books', name: 'کتاب و آموزش', slug: 'books', productCount: 0 },
  electronics: { key: 'electronics', name: 'لوازم الکترونیکی', slug: 'electronics', productCount: 0 },
  watches: { key: 'watches', name: 'ساعت و اکسسوری', slug: 'watches', productCount: 0 },
};

function fallbackFor(slug: string): FallbackCategory {
  return fallbackCategories[slug] ?? { key: slug, name: slug.replace(/[-_]+/g, ' '), slug, productCount: 0 };
}

async function getCategory(slug: string) {
  try {
    return await getCategoryRepository().findBySlug(slug);
  } catch {
    return null;
  }
}

async function getInitialCatalog(locale: string, categoryKey: string) {
  try {
    const result = await getProductService().listProducts({ categoryKey, page: 1, pageSize: 40, sort: 'recommended', isTraditional: false });
    const localized = await getProductLocalizedTexts(result.products.map((product) => product.id), normalizeCatalogLocale(locale));
    const products = result.products.map((product) => {
      const text = localized.get(product.id);
      return text ? { ...product, name: text.name, shortDescription: text.shortDescription } : product;
    });
    return { products, meta: { total: result.total, page: result.page, pageSize: result.pageSize, hasMore: result.hasMore } };
  } catch {
    return { products: [], meta: null };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = (await getCategory(slug)) ?? fallbackCategories[slug];
  if (!category) return { title: locale === 'en' ? 'Category | Eshop' : 'دسته‌بندی | ایشاپ' };
  const title = locale === 'en' ? `${category.name} | Eshop` : `${category.name} | ایشاپ`;
  const description = locale === 'en' ? `Browse ${category.name} products on Eshop.` : locale === 'ps' ? `د ${category.name} محصولات په ایشاپ کې وګورئ.` : `محصولات دسته «${category.name}» را در ایشاپ ببینید.`;
  return { title, description, robots: { index: true, follow: true } };
}

export default async function CategoryPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const category = (await getCategory(slug)) ?? fallbackFor(slug);
  const initialCatalog = await getInitialCatalog(locale, category.key);
  const t = await getTranslations({ locale, namespace: 'nav' });
  const count = Number(category.productCount ?? 0);
  const countLabel = locale === 'en' ? 'products' : locale === 'ps' ? 'محصولات' : 'محصول';
  const allCategories = locale === 'en' ? 'All categories' : locale === 'ps' ? 'ټولې کټګورۍ' : 'همه دسته‌ها';
  const hint = locale === 'en' ? 'Use the filters below to narrow the catalog.' : locale === 'ps' ? 'لاندې فلټرونه وکاروئ او خپل محصولات ژر پیدا کړئ.' : 'از فیلترهای پایین برای رسیدن سریع‌تر به محصول مناسب استفاده کنید.';

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main id="main" className="pb-16 md:pb-0">
        <section className="border-b border-border bg-card">
          <div className="mx-auto max-w-screen-xl px-3 py-5 sm:px-6 sm:py-7">
            <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Link href="/categories" className="font-semibold hover:text-primary">{t('categories')}</Link>
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
              <span className="font-semibold text-foreground">{category.name}</span>
            </div>

            <div className="overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/[0.08] via-card to-card p-5 shadow-sm sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/80 px-3 py-1 text-[10px] font-extrabold text-primary">
                    <Package className="h-3.5 w-3.5" aria-hidden />
                    {locale === 'en' ? 'Marketplace category' : locale === 'ps' ? 'د بازار کټګوري' : 'دسته‌بندی بازار'}
                  </div>
                  <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-4xl">{category.name}</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{hint}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <span className="rounded-full border border-border bg-background px-3 py-1.5">{count.toLocaleString(locale === 'ps' ? 'ps-AF' : locale === 'en' ? 'en-US' : 'fa-IR')} {countLabel}</span>
                    <span className="rounded-full border border-border bg-background px-3 py-1.5">{locale === 'en' ? 'Real seller products' : locale === 'ps' ? 'د پلورونکو اصلي محصولات' : 'محصولات واقعی فروشندگان'}</span>
                  </div>
                </div>
                <Link href="/categories" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-bold text-foreground hover:border-primary/40 hover:text-primary">
                  <SlidersHorizontal className="h-4 w-4" aria-hidden />
                  {allCategories}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-screen-xl px-3 sm:px-6">
          <ShopPageClient locale={locale} currency="AFN" initialCategoryKey={category.key} initialProducts={initialCatalog.products} initialMeta={initialCatalog.meta} />
        </section>
      </main>
      <SiteFooter />
      <BottomNavigation />
    </div>
  );
}
