import { getTranslations, getLocale } from 'next-intl/server';
import { ArrowLeft, FolderTree } from 'lucide-react';
import { Container } from '@/components/layout/container';
import { Link } from '@/i18n/routing';
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
    <section aria-labelledby="categories-title" className="section-band">
      <Container size="xl">
        <div className="section-head">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/10">
              <FolderTree className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 id="categories-title" className="section-head-title">{t('sectionTitle')}</h2>
              <p className="section-head-sub">{t('sectionSubtitle')}</p>
            </div>
          </div>
          <Link href="/categories" className="section-head-action">
            <span>{t('viewAll')}</span><ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid auto-cols-[92px] grid-flow-col grid-rows-2 gap-3 overflow-x-auto pb-1 no-scrollbar snap-x snap-mandatory sm:auto-cols-[104px] lg:grid-flow-row lg:grid-cols-10 lg:grid-rows-1 lg:overflow-visible">
          {roots.map((item) => <CategoryCard key={item.id} item={item} />)}
        </div>
      </Container>
    </section>
  );
}
