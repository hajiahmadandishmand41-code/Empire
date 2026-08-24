import { getTranslations, getLocale } from 'next-intl/server';
import { ArrowLeft, FolderTree } from 'lucide-react';
import { Container } from '@/components/layout/container';
import Link from 'next/link';
import { CategoryCard } from './category-card';
import { getCategoryRepository } from '@/server/infrastructure/registry';

export async function CategoriesSection() {
  const [t, locale, categories] = await Promise.all([
    getTranslations('home.categories'),
    getLocale(),
    getCategoryRepository().findAll(true, true).catch(() => []),
  ]);
  const roots = categories.filter((category) => !category.parentId).slice(0, 10);
  if (!roots.length) return null;

  return (
    <section aria-labelledby="categories-title" className="border-b border-border bg-card py-6 sm:py-8">
      <Container size="xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/10">
              <FolderTree className="h-[18px] w-[18px] text-primary" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 id="categories-title" className="text-base font-black leading-tight text-foreground sm:text-lg">{t('sectionTitle')}</h2>
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{t('sectionSubtitle')}</p>
            </div>
          </div>
          <Link href={`/${locale}/categories`} className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-muted-foreground transition hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span>{t('viewAll')}</span><ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar sm:grid sm:grid-cols-5 sm:gap-3 lg:grid-cols-8 lg:overflow-visible">
          {roots.map((item) => <CategoryCard key={item.id} item={item} />)}
        </div>
      </Container>
    </section>
  );
}
