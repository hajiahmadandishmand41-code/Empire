import Image from 'next/image';
import { Package } from 'lucide-react';
import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { CategoryRow } from '@/server/repositories/category.repository';

interface CategoryCardProps { item: CategoryRow; }

const CATEGORY_EMOJI: Record<string, string> = {
  electronics: '📱', mobiles: '📱', laptops: '💻', fashion: '👗', clothing: '👕', home: '🏠',
  homeKitchen: '🍽️', beauty: '✨', groceries: '🛒', food: '🍯', books: '📚', sports: '⚽',
  toys: '🧸', handmade: '🏺', traditional: '🇦🇫',
};

export async function CategoryCard({ item }: CategoryCardProps) {
  const locale = await getLocale();
  const title = item.name?.trim() || item.key;
  const productCount = Number(item.productCount ?? 0);
  const productLabel = locale === 'en' ? 'products' : locale === 'ps' ? 'محصولات' : 'محصول';
  const numberLocale = locale === 'en' ? 'en-US' : locale === 'ps' ? 'ps-AF' : 'fa-IR';
  const emoji = CATEGORY_EMOJI[item.key] ?? '📦';

  return (
    <Link
      href={`/category/${item.slug}` as never}
      aria-label={title}
      className="group relative aspect-square min-w-0 snap-start overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="absolute inset-0 bg-muted">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={title} fill sizes="84px" loading="lazy" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-primary/5"><Package className="h-5 w-5 text-primary/35" aria-hidden="true" /></div>
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/5 to-transparent" aria-hidden="true" />
      <div className="absolute end-1 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-white/25 bg-white/90 text-[13px] shadow-sm backdrop-blur-sm dark:bg-slate-950/80" aria-hidden="true">
        <span className="leading-none">{emoji}</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-1.5 text-white">
        <span className="line-clamp-2 text-[8px] font-black leading-3 drop-shadow-sm sm:text-[9px] sm:leading-3.5">{title}</span>
        {productCount > 0 ? <span className="mt-0.5 block truncate text-[6.5px] font-medium text-white/75 sm:text-[7px]">{productCount.toLocaleString(numberLocale)} {productLabel}</span> : null}
      </div>
    </Link>
  );
}
