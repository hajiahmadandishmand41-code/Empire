import Image from 'next/image';
import { Package } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import type { CategoryRow } from '@/server/repositories/category.repository';

interface CategoryCardProps { item: CategoryRow; }

export async function CategoryCard({ item }: CategoryCardProps) {
  const t = await getTranslations('home.categories.items');
  const title = (() => { try { return t(`${item.key}.title` as Parameters<typeof t>[0]); } catch { return item.name; } })();
  const productCount = Number(item.productCount ?? 0);

  return (
    <Link
      href={`/category/${item.slug}` as never}
      aria-label={title}
      className="group relative h-[118px] w-[118px] shrink-0 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-[132px] sm:w-auto sm:shrink"
    >
      <div className="absolute inset-0 bg-muted">
        {item.imageUrl ? <Image src={item.imageUrl} alt={title} fill sizes="(max-width: 639px) 118px, (max-width: 1023px) 20vw, 13vw" loading="lazy" className="object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-primary/5"><Package className="h-7 w-7 text-primary/35" aria-hidden="true" /></div>}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 p-2.5 text-white">
        <span className="line-clamp-2 text-[10px] font-black leading-4 drop-shadow-sm sm:text-[11px]">{title}</span>
        {productCount > 0 ? <span className="mt-0.5 block text-[8px] font-medium text-white/75 sm:text-[9px]">{productCount.toLocaleString()} محصول</span> : null}
      </div>
    </Link>
  );
}
