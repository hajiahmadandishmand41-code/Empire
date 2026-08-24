import Image from 'next/image';
import { ArrowLeft, BadgeCheck, Tags } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { getSellerRepository } from '@/server/infrastructure/registry';

type Locale = 'fa' | 'ps' | 'en';

const copy = {
  fa: { title: 'برندهای ایشاپ', subtitle: 'برندهای معتبر را در یک نگاه کشف کنید.', viewAll: 'همه برندها', brand: 'برند' },
  ps: { title: 'د ایشاپ برانډونه', subtitle: 'باوري برانډونه په یوه کتنه کې ومومئ.', viewAll: 'ټول برانډونه', brand: 'برانډ' },
  en: { title: 'Eshop brands', subtitle: 'Discover trusted brands at a glance.', viewAll: 'View all brands', brand: 'Brand' },
} as const;

export async function BrandsSection({ locale }: { locale: Locale }) {
  const result = await getSellerRepository().findPublicMany({ q: '', page: 1, pageSize: 10 });
  if (!result.items.length) return null;
  const t = copy[locale];

  return (
    <section aria-labelledby="brands-title" className="border-b border-border bg-card py-4 sm:py-6">
      <div className="mx-auto max-w-screen-xl px-3 sm:px-6">
        <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/10 sm:h-9 sm:w-9">
              <Tags className="h-4 w-4 text-primary" aria-hidden />
            </div>
            <div className="min-w-0"><h2 id="brands-title" className="truncate text-sm font-black leading-tight text-foreground sm:text-lg">{t.title}</h2><p className="mt-0.5 line-clamp-1 text-[9px] text-muted-foreground sm:text-xs">{t.subtitle}</p></div>
          </div>
          <Link href="/brands" className="flex min-h-8 shrink-0 items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-[9px] font-bold text-muted-foreground transition hover:border-primary/30 hover:text-primary sm:min-h-9 sm:px-3 sm:text-xs">{t.viewAll}<ArrowLeft className="h-3 w-3 rtl:rotate-180" aria-hidden /></Link>
        </div>

        <div className="grid auto-cols-[74px] grid-flow-col grid-rows-2 gap-x-2 gap-y-2 overflow-x-auto pb-1 no-scrollbar snap-x snap-mandatory sm:auto-cols-[84px] sm:gap-x-2.5 sm:gap-y-2.5 lg:grid-flow-row lg:grid-cols-10 lg:grid-rows-1 lg:overflow-visible">
          {result.items.map((store) => (
            <Link key={store.id} href={`/store/${store.id}` as never} aria-label={store.shopName} className="group flex min-w-0 snap-start flex-col items-center gap-1 rounded-xl p-1 text-center transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-[transform,box-shadow,border-color] group-hover:scale-105 group-hover:border-primary/30 group-hover:shadow-md sm:h-14 sm:w-14">
                {store.logoUrl ? <Image src={store.logoUrl} alt="" fill sizes="56px" className="object-cover" /> : <span className="text-sm font-black text-primary">{store.shopName.charAt(0)}</span>}
                <span className="absolute -end-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-background bg-emerald-500 text-white shadow-sm"><BadgeCheck className="h-2 w-2" aria-hidden /></span>
              </span>
              <span className="w-full truncate text-[8px] font-bold text-foreground group-hover:text-primary sm:text-[9px]">{store.shopName}</span>
              <span className="text-[7px] text-muted-foreground sm:text-[8px]">{t.brand}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
