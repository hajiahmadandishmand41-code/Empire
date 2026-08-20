import { getLocale, getTranslations } from 'next-intl/server';
import { Smartphone, Home as HomeIcon, Dumbbell, Baby, Zap, LayoutGrid, ShoppingBag, BookOpen, Shirt, Watch, Package } from 'lucide-react';
import type { ComponentType } from 'react';
import { Link } from '@/i18n/routing';

type CategoryKey = 'clothing' | 'digital' | 'homeAppliances' | 'beauty' | 'sports' | 'footwear' | 'baby' | 'books' | 'electronics' | 'watches';

const categoryIcons: Record<CategoryKey, ComponentType<{ className?: string }>> = {
  clothing: Shirt, digital: Smartphone, homeAppliances: HomeIcon, beauty: Package, sports: Dumbbell,
  footwear: ShoppingBag, baby: Baby, books: BookOpen, electronics: Zap, watches: Watch,
};

const CATEGORY_KEYS: CategoryKey[] = ['clothing', 'digital', 'homeAppliances', 'beauty', 'sports', 'footwear', 'baby', 'books', 'electronics', 'watches'];

export async function HeaderCategoryNav() {
  const [t, tCategories, locale] = await Promise.all([getTranslations('categoryNav'), getTranslations('home.categories.items'), getLocale()]);
  return (
    <nav aria-label={t('ariaLabel')} className="hidden border-b border-border bg-card md:block">
      <div className="mx-auto max-w-screen-xl px-6">
        <div className="flex items-center gap-0 overflow-x-auto py-0 no-scrollbar">
          <Link href="/categories" className="flex shrink-0 items-center gap-1.5 border-b-2 border-rose-500 px-3.5 py-3 text-xs font-medium text-rose-600 transition-all dark:border-rose-400 dark:text-rose-300">
            <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{locale === 'en' ? 'Categories' : locale === 'ps' ? 'وېشنیزې' : 'دسته‌بندی‌ها'}</span>
          </Link>
          {CATEGORY_KEYS.map((key) => {
            const Icon = categoryIcons[key];
            return (
              <Link key={key} href="/categories" className="flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-3.5 py-3 text-xs font-medium text-muted-foreground transition-all hover:border-rose-500 hover:text-rose-600 dark:hover:border-rose-400 dark:hover:text-rose-300">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{tCategories(`${key}.title` as Parameters<typeof tCategories>[0])}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
