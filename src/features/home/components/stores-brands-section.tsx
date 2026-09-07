import { ArrowLeft, BadgeCheck, Package, Star, Store, Tags } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { ShapeMonogram } from '@/components/decorative-shapes';

type Locale = 'fa' | 'ps' | 'en';

export type StoreTile = {
  id: string;
  shopName: string;
  productCount: number;
  rating?: number;
  city?: string;
  logoUrl?: string | null;
};

export type BrandTile = {
  id: string;
  slug: string;
  name: string;
  productCount: number;
  logoUrl?: string | null;
};

const COPY: Record<Locale, {
  storesTitle: string; storesSub: string; storesAll: string;
  brandsTitle: string; brandsSub: string; brandsAll: string;
  products: string; verified: string;
}> = {
  fa: {
    storesTitle: 'فروشگاه‌های برتر',
    storesSub: 'فروشندگان تأییدشده با بیشترین رضایت مشتری',
    storesAll: 'همه فروشگاه‌ها',
    brandsTitle: 'برندهای محبوب',
    brandsSub: 'برندهای معتبر را در یک نگاه پیدا کنید',
    brandsAll: 'همه برندها',
    products: 'محصول',
    verified: 'تأییدشده',
  },
  ps: {
    storesTitle: 'غوره پلورنځي',
    storesSub: 'تایید شوي پلورونکي د پیرودونکو ډېرې خوښۍ سره',
    storesAll: 'ټول پلورنځي',
    brandsTitle: 'مشهور برانډونه',
    brandsSub: 'باوري برانډونه په یوه کتنه کې ومومئ',
    brandsAll: 'ټول برانډونه',
    products: 'محصولات',
    verified: 'تایید شوی',
  },
  en: {
    storesTitle: 'Top stores',
    storesSub: 'Verified sellers with the highest customer satisfaction',
    storesAll: 'All stores',
    brandsTitle: 'Popular brands',
    brandsSub: 'Find trusted brands at a glance',
    brandsAll: 'All brands',
    products: 'products',
    verified: 'Verified',
  },
};

/**
 * Stores and brands, side by side.
 *
 * These used to be two separate full-width bands sitting far apart on the
 * page (stores near the top, brands right above the footer), which made the
 * homepage longer without making it more useful. Pairing them into one
 * two-column band keeps both discoverable, halves the vertical space, and
 * lets them share a single heading rhythm.
 */
export function StoresBrandsSection({
  stores,
  brands,
  locale = 'fa',
}: {
  stores: StoreTile[];
  brands: BrandTile[];
  locale?: Locale;
}) {
  const t = COPY[locale] ?? COPY.fa;
  const numberLocale = locale === 'en' ? 'en-US' : locale === 'ps' ? 'ps-AF' : 'fa-IR';
  if (!stores.length && !brands.length) return null;

  return (
    <section className="section-band section-band-alt" aria-label={`${t.storesTitle} — ${t.brandsTitle}`}>
      <div className="section-shell grid gap-6 lg:grid-cols-2 lg:gap-8">
        {/* ---------------- Stores ---------------- */}
        {stores.length > 0 && (
          <div>
            <div className="section-head">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/12 text-violet-600 dark:text-violet-400">
                  <Store className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="section-head-title">{t.storesTitle}</h2>
                  <p className="section-head-sub">{t.storesSub}</p>
                </div>
              </div>
              <Link href="/stores" className="section-head-action">
                {t.storesAll}
                <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
              </Link>
            </div>

            {/* Horizontal rows: a store is identity + numbers, which reads far
                better on a wide row than squeezed under a small circle. */}
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {stores.slice(0, 6).map((store) => (
                <li key={store.id}>
                  <Link
                    href={`/store/${store.id}` as never}
                    className="surface-card surface-card-interactive group flex items-center gap-3 p-2.5"
                    aria-label={store.shopName}
                  >
                    <span className="relative h-12 w-12 shrink-0 sm:h-14 sm:w-14">
                      {store.logoUrl ? (
                        <span className="relative block h-full w-full overflow-hidden rounded-full border border-border">
                          <Image src={store.logoUrl} alt="" fill sizes="56px" className="object-cover" />
                        </span>
                      ) : (
                        <ShapeMonogram seed={store.id} label={store.shopName} className="h-full w-full text-lg" />
                      )}
                      <span className="absolute -end-0.5 -bottom-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-emerald-500 text-white" title={t.verified}>
                        <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                      </span>
                    </span>

                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-[13px] font-black text-foreground transition-colors group-hover:text-primary">
                        {store.shopName}
                      </strong>
                      <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Package className="h-3 w-3 shrink-0" aria-hidden="true" />
                          {store.productCount.toLocaleString(numberLocale)} {t.products}
                        </span>
                        {typeof store.rating === 'number' && store.rating > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                            <Star className="h-3 w-3 shrink-0 fill-current" aria-hidden="true" />
                            {store.rating.toFixed(1)}
                          </span>
                        ) : null}
                        {store.city ? <span className="truncate">{store.city}</span> : null}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ---------------- Brands ---------------- */}
        {brands.length > 0 && (
          <div>
            <div className="section-head">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <Tags className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="section-head-title">{t.brandsTitle}</h2>
                  <p className="section-head-sub">{t.brandsSub}</p>
                </div>
              </div>
              <Link href="/brands" className="section-head-action">
                {t.brandsAll}
                <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
              </Link>
            </div>

            {/* Brands are a logo-recognition task, so a compact tile grid with
                a real (shape) mark beats the old 8px-caption strip. */}
            <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
              {brands.slice(0, 8).map((brand) => (
                <li key={brand.id}>
                  <Link
                    href={`/brands/${brand.slug}` as never}
                    className="surface-card surface-card-interactive group flex flex-col items-center gap-2 p-3 text-center"
                    aria-label={brand.name}
                  >
                    <span className="relative h-12 w-12 sm:h-14 sm:w-14">
                      {brand.logoUrl ? (
                        <span className="relative block h-full w-full overflow-hidden rounded-2xl border border-border">
                          <Image src={brand.logoUrl} alt="" fill sizes="56px" className="object-cover" />
                        </span>
                      ) : (
                        <ShapeMonogram seed={brand.slug} label={brand.name} rounded={false} className="h-full w-full text-lg" />
                      )}
                    </span>
                    <span className="w-full min-w-0">
                      <strong className="block truncate text-[11px] font-black text-foreground transition-colors group-hover:text-primary">
                        {brand.name}
                      </strong>
                      <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                        {brand.productCount.toLocaleString(numberLocale)} {t.products}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
