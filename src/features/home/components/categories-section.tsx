import { getTranslations, getLocale } from 'next-intl/server';
import { ArrowLeft, FolderTree } from 'lucide-react';
import { Container } from '@/components/layout/container';
import Link from 'next/link';
import { CategoryCard } from './category-card';
import { getCategoryRepository } from '@/server/infrastructure/registry';
import { isDatabaseConfigured } from '@/lib/db';

export async function CategoriesSection() {
  const [t, locale] = await Promise.all([
    getTranslations('home.categories'),
    getLocale(),
  ]);
  if (!isDatabaseConfigured()) return null;
  const categories = await getCategoryRepository().findAll(true, true).catch(() => []);
  const roots = categories.filter((category) => !category.parentId).slice(0, 10);
  if (!roots.length) return null;

  return (
    <section aria-labelledby="categories-title" className="border-b border-border bg-card py-4 sm:py-6">
      <Container size="xl">
        <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/10 sm:h-9 sm:w-9">
              <FolderTree className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 id="categories-title" className="text-sm font-black leading-tight text-foreground sm:text-lg">{t('sectionTitle')}</h2>
              <p className="mt-0.5 line-clamp-1 text-[9px] text-muted-foreground sm:text-xs">{t('sectionSubtitle')}</p>
            </div>
          </div>
          <Link href={`/${locale}/categories`} className="flex min-h-8 shrink-0 items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-[9px] font-bold text-muted-foreground transition hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-9 sm:px-3 sm:text-xs">
            <span>{t('viewAll')}</span><ArrowLeft className="h-3 w-3 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid auto-cols-[74px] grid-flow-col grid-rows-2 gap-x-2 gap-y-2 overflow-x-auto pb-1 no-scrollbar snap-x snap-mandatory sm:auto-cols-[84px] sm:gap-x-2.5 sm:gap-y-2.5 lg:grid-flow-row lg:grid-cols-10 lg:grid-rows-1 lg:overflow-visible">
          {roots.map((item) => <CategoryCard key={item.id} item={item} />)}
        </div>
      </Container>
    </section>
  );
}
