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
      className="group flex min-w-0 w-[82px] snap-start flex-col items-center gap-1.5 rounded-xl p-1 text-center transition-all duration-300 hover:-translate-y-1 hover:bg-primary/[0.06] hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:w-[88px]"
    >
      <span className="relative block h-[66px] w-[66px] shrink-0 overflow-hidden rounded-full border-2 border-border/50 bg-muted shadow-sm ring-2 ring-background transition-all duration-300 group-hover:border-primary/30 group-hover:ring-primary/10 sm:h-[68px] sm:w-[68px]">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={title} fill sizes="68px" loading="lazy" className="object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-primary/5"><Package className="h-5 w-5 text-primary/35" aria-hidden="true" /></span>
        )}
      </span>
      <span className="line-clamp-2 min-h-7 w-full text-[8px] font-extrabold leading-3 text-foreground sm:text-[9px] sm:leading-3.5">{title}</span>
      {productCount > 0 ? <span className="-mt-0.5 w-full truncate text-[6.5px] font-medium text-muted-foreground sm:text-[7px]">{productCount.toLocaleString(numberLocale)} {productLabel}</span> : null}
    </Link>
  );
}
