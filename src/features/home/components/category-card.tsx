import Image from 'next/image';
import { Package } from 'lucide-react';
import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { CategoryRow } from '@/server/repositories/category.repository';

interface CategoryCardProps { item: CategoryRow; }

export async function CategoryCard({ item }: CategoryCardProps) {
  const locale = await getLocale();
  const title = item.name?.trim() || item.key;
  const productCount = Number(item.productCount ?? 0);
  const productLabel = locale === 'en' ? 'products' : locale === 'ps' ? 'محصولات' : 'محصول';
  const numberLocale = locale === 'en' ? 'en-US' : locale === 'ps' ? 'ps-AF' : 'fa-IR';

  return (
    <Link
      href={`/category/${item.slug}` as never}
      aria-label={title}
      className="group flex w-full min-w-0 snap-start flex-col items-center gap-2 rounded-xl p-1.5 text-center transition-all duration-300 hover:-translate-y-1 hover:bg-primary/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span className="relative block h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full border-2 border-border/50 bg-muted shadow-sm ring-2 ring-background transition-all duration-300 group-hover:border-primary/40 group-hover:ring-primary/10 sm:h-[80px] sm:w-[80px]">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={title} fill sizes="80px" loading="lazy" className="object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-primary/5"><Package className="h-6 w-6 text-primary/35" aria-hidden="true" /></span>
        )}
      </span>
      <span className="line-clamp-2 min-h-8 w-full text-[11px] font-extrabold leading-4 text-foreground transition-colors group-hover:text-primary">{title}</span>
      {productCount > 0 ? <span className="w-full truncate text-[10px] font-medium text-muted-foreground">{productCount.toLocaleString(numberLocale)} {productLabel}</span> : null}
    </Link>
  );
}
