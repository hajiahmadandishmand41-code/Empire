import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import type { CategoryItem } from '../data/categories';

interface CategoryCardProps { item: CategoryItem; }

export async function CategoryCard({ item }: CategoryCardProps) {
  const { key, Icon, accent } = item;
  const t = await getTranslations('home.categories.items');
  const title = t(`${key}.title` as Parameters<typeof t>[0]);

  return (
    <Link
      href={`/category/${key}` as never}
      aria-label={title}
      className={cn(
        'group flex min-h-[102px] flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center shadow-sm transition-[transform,box-shadow,border-color,background-color] duration-200 category-card',
        'border-border/60 bg-card hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50/40 hover:shadow-md',
        'dark:border-gray-700/50 dark:bg-gray-800/60 dark:hover:border-rose-700/60 dark:hover:bg-gray-700/70',
      )}
    >
      <span
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br shadow-sm ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-105',
          accent.from,
          accent.to,
        )}
      >
        <Icon className="h-6 w-6 text-gray-800 dark:text-gray-100" aria-hidden />
      </span>
      <span
        className={cn(
          'text-[11px] font-bold leading-tight sm:text-xs',
          'text-foreground group-hover:text-rose-600 dark:text-gray-200 dark:group-hover:text-rose-300',
        )}
      >
        {title}
      </span>
    </Link>
  );
}
