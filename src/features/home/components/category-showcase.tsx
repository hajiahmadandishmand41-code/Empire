import Image from 'next/image';
import { ArrowLeft, LayoutGrid } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { ShapePattern, paletteFor } from '@/components/decorative-shapes';

type Locale = 'fa' | 'ps' | 'en';

export type CategoryTile = {
  id: string;
  key: string;
  slug: string;
  name: string;
  productCount: number;
  imageUrl?: string | null;
};

const COPY: Record<Locale, { title: string; subtitle: string; all: string; products: string }> = {
  fa: { title: 'خرید بر اساس دسته‌بندی', subtitle: 'از میان دسته‌های پرطرفدار انتخاب کنید', all: 'همه دسته‌بندی‌ها', products: 'محصول' },
  ps: { title: 'د کټګورۍ له مخې پیرود', subtitle: 'د مشهورو کټګوریو څخه غوره کړئ', all: 'ټولې کټګورۍ', products: 'محصولات' },
  en: { title: 'Shop by category', subtitle: 'Pick from the most popular categories', all: 'All categories', products: 'products' },
};

/**
 * Category showcase.
 *
 * The old version was a two-row strip of 74px circles with 8px captions —
 * essentially unreadable, and every tile without an uploaded image collapsed
 * to the same grey circle. This version gives each category a real tile with
 * a deterministic coloured shape, a legible name and its product count, so
 * the row communicates both *what* the category is and *how big* it is.
 *
 * The first tile is deliberately larger on desktop to give the band a focal
 * point instead of ten identical boxes.
 */
export function CategoryShowcase({ categories, locale = 'fa' }: { categories: CategoryTile[]; locale?: Locale }) {
  const t = COPY[locale] ?? COPY.fa;
  const numberLocale = locale === 'en' ? 'en-US' : locale === 'ps' ? 'ps-AF' : 'fa-IR';
  if (!categories.length) return null;

  return (
    <section className="section-band" aria-labelledby="category-showcase-title">
      <div className="section-shell">
        <div className="section-head">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <LayoutGrid className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="category-showcase-title" className="section-head-title">{t.title}</h2>
              <p className="section-head-sub">{t.subtitle}</p>
            </div>
          </div>
          <Link href="/categories" className="section-head-action">
            {t.all}
            <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>

        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {categories.slice(0, 10).map((category) => {
            const palette = paletteFor(category.slug || category.key);
            return (
              <li key={category.id}>
                <Link
                  href={`/category/${category.slug}` as never}
                  className="surface-card surface-card-interactive group relative flex h-full items-center gap-3 overflow-hidden p-2.5"
                  aria-label={category.name}
                >
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl sm:h-16 sm:w-16">
                    {category.imageUrl ? (
                      <Image src={category.imageUrl} alt="" fill sizes="64px" loading="lazy" className="object-cover" />
                    ) : (
                      <ShapePattern seed={category.slug || category.key} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="line-clamp-2 text-xs font-black leading-snug text-foreground transition-colors group-hover:text-primary sm:text-[13px]">
                      {category.name}
                    </strong>
                    {category.productCount > 0 ? (
                      <span className="mt-1 block truncate text-[10px] font-medium text-muted-foreground">
                        {category.productCount.toLocaleString(numberLocale)} {t.products}
                      </span>
                    ) : null}
                  </span>
                  {/* Thin accent edge tinted to the category's own colour so
                      the grid reads as a set of distinct destinations. */}
                  <span
                    className="absolute inset-y-0 start-0 w-1 opacity-70 transition-opacity group-hover:opacity-100"
                    style={{ background: palette.from }}
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
