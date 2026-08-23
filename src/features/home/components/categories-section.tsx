import { getTranslations, getLocale } from 'next-intl/server';
import { ArrowLeft, LayoutGrid } from 'lucide-react';
import { Container } from '@/components/layout/container';
import Link from 'next/link';
import { categories } from '../data/categories';
import { CategoryCard } from './category-card';

export async function CategoriesSection() {
  const [t, locale] = await Promise.all([
    getTranslations('home.categories'),
    getLocale(),
  ]);

  return (
    <section aria-labelledby="categories-title" className="border-b border-border bg-card py-6 sm:py-8">
      <Container size="xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 ring-1 ring-rose-100 dark:bg-rose-950/40 dark:ring-rose-900/50">
              <LayoutGrid className="h-[18px] w-[18px] text-rose-600 dark:text-rose-400" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 id="categories-title" className="text-base font-extrabold leading-tight text-foreground sm:text-lg">
                {t('sectionTitle')}
              </h2>
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{t('sectionSubtitle')}</p>
            </div>
          </div>
          <Link href={`/${locale}/categories`} className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-rose-300 hover:text-rose-600 hover:shadow-sm dark:hover:border-rose-700 dark:hover:text-rose-400">
            <span>{t('viewAll')}</span>
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-x-2.5 gap-y-4 sm:grid-cols-4 sm:gap-3 lg:grid-cols-8 lg:gap-3.5">
          {categories.slice(0, 8).map((item, i) => (
            <div key={item.key} className="min-w-0 animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
              <CategoryCard item={item} />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
