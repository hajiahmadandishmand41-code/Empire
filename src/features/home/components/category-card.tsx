import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { CategoryItem } from '../data/categories';

type CategoryKey = CategoryItem['key'];

const FALLBACK_TITLES: Record<CategoryKey, string> = {
  clothing:      'پوشاک',
  digital:       'دیجیتال',
  homeAppliances:'لوازم خانگی',
  beauty:        'آرایشی',
  sports:        'ورزشی',
  footwear:      'کفش',
  baby:          'کودک',
  books:         'کتاب',
  electronics:   'الکترونیک',
  watches:       'ساعت',
};

interface CategoryCardProps {
  item: CategoryItem;
}

export async function CategoryCard({ item }: CategoryCardProps) {
  const { key, Icon, accent } = item;
  let title = FALLBACK_TITLES[key] ?? key;

  try {
    const t = await getTranslations('home.categories.items');
    title = t(`${key}.title` as Parameters<typeof t>[0]);
  } catch {
    // fallback
  }

  return (
    <Link
      href={`/shop?categoryKey=${key}`}
      className={cn(
        'group flex flex-col items-center gap-2 rounded-2xl border p-3 text-center shadow-sm category-card',
        // Light
        'border-border/60 bg-card hover:border-rose-200 hover:bg-rose-50/40 hover:shadow-rose-100/60',
        // Dark
        'dark:border-gray-700/50 dark:bg-gray-800/60 dark:hover:border-rose-700/60 dark:hover:bg-gray-700/70',
      )}
    >
      {/* Icon container */}
      <div
        className={cn(
          'flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm',
          'transition-transform duration-250 group-hover:scale-110 group-hover:rotate-3',
          accent.from,
          accent.to,
        )}
      >
        <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-gray-700 dark:text-gray-100 drop-shadow-sm" aria-hidden />
      </div>

      {/* Label */}
      <span className={cn(
        'text-[11px] sm:text-xs font-bold leading-tight transition-colors line-clamp-2',
        'text-foreground group-hover:text-rose-600',
        'dark:text-gray-200 dark:group-hover:text-rose-300',
      )}>
        {title}
      </span>
    </Link>
  );
}
