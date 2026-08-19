import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { CategoryItem } from '../data/categories';

interface CategoryCardProps { item: CategoryItem; }

const images: Record<string, string> = {
  clothing: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=80',
  digital: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=700&q=80',
  homeAppliances: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=700&q=80',
  beauty: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=700&q=80',
  sports: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=700&q=80',
  footwear: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80',
  baby: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=700&q=80',
  books: 'https://images.unsplash.com/photo-1495446815903-7f8da24fdf2a?auto=format&fit=crop&w=700&q=80',
  electronics: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80',
  watches: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80',
};

export async function CategoryCard({ item }: CategoryCardProps) {
  const { key, accent } = item;
  const t = await getTranslations('home.categories.items');
  const title = t(`${key}.title` as Parameters<typeof t>[0]);
  const image = images[key];

  return (
    <Link
      href={`/shop?categoryKey=${key}` as never}
      className={cn(
        'group relative flex min-h-[128px] flex-col justify-end overflow-hidden rounded-2xl border p-2 text-start shadow-sm category-card',
        'border-border/60 bg-card transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md',
        'dark:border-gray-700/50 dark:bg-gray-800/60',
      )}
    >
      {image && <Image src={image} alt="" fill sizes="(max-width:640px) 88px, (max-width:1024px) 25vw, 12vw" className="object-cover opacity-80 transition-transform duration-500 group-hover:scale-105" aria-hidden />}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/0" aria-hidden />
      <div className={cn('relative z-10 mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-white shadow-sm backdrop-blur-md', accent.from)}>
        <item.Icon className="h-4 w-4" aria-hidden />
      </div>
      <span className="relative z-10 px-0.5 pb-0.5 text-[11px] font-extrabold leading-tight text-white sm:text-xs line-clamp-2">
        {title}
      </span>
    </Link>
  );
}
