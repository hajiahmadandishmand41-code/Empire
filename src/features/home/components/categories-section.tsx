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
    <section aria-labelledby="categories-title" className="border-b border-border bg-card py-5 sm:py-7">
      <Container size="xl">
        <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/10 sm:h-10 sm:w-10">
              <FolderTree className="h-4 w-4 text-primary sm:h-[18px] sm:w-[18px]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 id="categories-title" className="text-sm font-black leading-tight text-foreground sm:text-lg">{t('sectionTitle')}</h2>
              <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground sm:text-xs">{t('sectionSubtitle')}</p>
            </div>
          </div>
          <Link href={`/${locale}/categories`} className="flex min-h-9 shrink-0 items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[10px] font-bold text-muted-foreground transition hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-10 sm:gap-1.5 sm:rounded-xl sm:px-3 sm:py-2 sm:text-xs">
            <span>{t('viewAll')}</span><ArrowLeft className="h-3 w-3 rtl:rotate-180 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-5 gap-2 sm:gap-2.5 lg:grid-cols-8 lg:gap-3">
          {roots.map((item) => <CategoryCard key={item.id} item={item} />)}
        </div>
      </Container>
    </section>
  );
}
