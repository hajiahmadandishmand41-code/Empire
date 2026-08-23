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
      className="group flex min-w-0 flex-col items-center gap-2 rounded-2xl p-1.5 text-center transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span
        className={cn(
          'flex h-16 w-16 items-center justify-center rounded-full border border-border/70 bg-gradient-to-br shadow-sm ring-2 ring-background transition-[transform,box-shadow,border-color] duration-200 group-hover:scale-105 group-hover:border-primary/25 group-hover:shadow-md sm:h-[72px] sm:w-[72px]',
          accent.from,
          accent.to,
        )}
      >
        <Icon className="h-7 w-7 text-gray-800 dark:text-gray-100 sm:h-8 sm:w-8" aria-hidden />
      </span>
      <span className="w-full line-clamp-2 text-[10px] font-bold leading-5 text-foreground group-hover:text-primary sm:text-xs">
        {title}
      </span>
    </Link>
  );
}
