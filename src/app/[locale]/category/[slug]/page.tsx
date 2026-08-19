import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { ShopPageClient } from '@/features/shop';
import { getCategoryRepository } from '@/server/infrastructure/registry';

type Props = { params: Promise<{ locale: string; slug: string }> };

async function getCategory(slug: string) {
  try {
    return await getCategoryRepository().findBySlug(slug);
  } catch (error) {
    console.error('[category-page] failed to load category', { slug, error });
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = await getCategory(slug);
  const name = category?.name ?? slug;
  const title = locale === 'en' ? `${name} | Eshop` : locale === 'ps' ? `${name} | Eshop` : `${name} | ایشاپ`;
  const description = locale === 'en' ? `Browse ${name} products on Eshop.` : locale === 'ps' ? `د ${name} محصولات په Eshop کې وګورئ.` : `محصولات دسته «${name}» را در ایشاپ ببینید.`;
  return { title, description, robots: { index: true, follow: true } };
}

export default async function CategoryPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const category = await getCategory(slug);
  if (!category) notFound();
  const t = await getTranslations({ locale, namespace: 'nav' });
  const heading = locale === 'en' ? category.name : locale === 'ps' ? category.name : category.name;
  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main id="main" className="pb-16 md:pb-0">
        <section className="border-b border-border bg-card">
          <div className="mx-auto max-w-screen-xl px-3 py-6 sm:px-6 sm:py-8">
            <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Link href="/categories" className="hover:text-primary">{t('categories')}</Link>
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
              <span className="font-semibold text-foreground">{heading}</span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-primary">Eshop</p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-4xl">{heading}</h1>
                <p className="mt-2 text-sm text-muted-foreground">{category.productCount.toLocaleString(locale === 'ps' ? 'ps-AF' : locale === 'en' ? 'en-US' : 'fa-IR')} محصول</p>
              </div>
              <Link href="/categories" className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold hover:border-primary/40 hover:text-primary">
                {locale === 'en' ? 'All categories' : locale === 'ps' ? 'ټولې کټګورۍ' : 'همه دسته‌ها'}
              </Link>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-screen-xl px-3 sm:px-6">
          <ShopPageClient locale={locale} currency="AFN" initialCategoryKey={category.key} />
        </section>
      </main>
      <SiteFooter />
      <BottomNavigation />
    </div>
  );
}
