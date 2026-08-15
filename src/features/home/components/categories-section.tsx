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
    <section
      aria-labelledby="categories-title"
      className="py-6 sm:py-8 border-b border-border bg-card"
    >
      <Container size="xl">
        {/* ── Header ── */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-100 dark:ring-rose-900/50">
              <LayoutGrid className="h-4.5 w-4.5 text-rose-600 dark:text-rose-400" aria-hidden />
            </div>
            <div>
              <h2 id="categories-title" className="text-base font-extrabold text-foreground sm:text-lg leading-tight">
                {t('sectionTitle')}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t('sectionSubtitle')}</p>
            </div>
          </div>
          <Link
            href={`/${locale}/shop`}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-all hover:border-rose-300 hover:text-rose-600 dark:hover:border-rose-700 dark:hover:text-rose-400 hover:-translate-y-0.5 hover:shadow-sm"
          >
            {t('viewAll')}
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        {/* ── Category grid ── */}
        <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0 lg:grid-cols-8 lg:gap-3">
          {categories.map((item, i) => (
            <div
              key={item.key}
              className="w-[88px] flex-shrink-0 sm:w-auto animate-fade-in"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <CategoryCard item={item} />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
