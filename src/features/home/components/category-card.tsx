import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import type { CategoryItem } from '../data/categories';

type CategoryKey = CategoryItem['key'];

interface CategoryCardProps { item: CategoryItem; }

export async function CategoryCard({ item }: CategoryCardProps) {
  const { key, Icon, accent } = item;
  const t = await getTranslations('home.categories.items');
  const title = t(`${key}.title` as Parameters<typeof t>[0]);

  return (
    <Link
      href={`/shop?categoryKey=${key}` as never}
      className={cn(
        'group flex flex-col items-center gap-2 rounded-2xl border p-3 text-center shadow-sm category-card',
        'border-border/60 bg-card hover:border-rose-200 hover:bg-rose-50/40 hover:shadow-rose-100/60',
        'dark:border-gray-700/50 dark:bg-gray-800/60 dark:hover:border-rose-700/60 dark:hover:bg-gray-700/70',
      )}
    >
      <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm transition-transform duration-250 group-hover:scale-110 group-hover:rotate-3', accent.from, accent.to)}>
        <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-gray-700 dark:text-gray-100 drop-shadow-sm" aria-hidden />
      </div>
      <span className={cn('text-[11px] sm:text-xs font-bold leading-tight transition-colors line-clamp-2', 'text-foreground group-hover:text-rose-600', 'dark:text-gray-200 dark:group-hover:text-rose-300')}>
        {title}
      </span>
    </Link>
  );
}
