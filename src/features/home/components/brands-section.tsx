import Image from 'next/image';
import { ArrowLeft, BadgeCheck, Tags } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { getSellerRepository } from '@/server/infrastructure/registry';

type Locale = 'fa' | 'ps' | 'en';

const copy = {
  fa: { title: 'برندهای ایشاپ', subtitle: 'هر فروشگاه، یک برند؛ برندهای معتبر را بشناسید.', viewAll: 'همه برندها', brand: 'برند' },
  ps: { title: 'د ایشاپ برانډونه', subtitle: 'هر پلورنځی یوه برانډي هویت لري؛ غوره پلورنځي ومومئ.', viewAll: 'ټول برانډونه', brand: 'برانډ' },
  en: { title: 'Eshop brands', subtitle: 'Every store has a brand identity. Discover trusted names.', viewAll: 'View all brands', brand: 'Brand' },
} as const;

export async function BrandsSection({ locale }: { locale: Locale }) {
  const result = await getSellerRepository().findPublicMany({ q: '', page: 1, pageSize: 10 });
  if (!result.items.length) return null;
  const t = copy[locale];

  return (
    <section aria-labelledby="brands-title" className="border-b border-border bg-card py-6 sm:py-7">
      <div className="mx-auto max-w-screen-xl px-3 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Tags className="h-4.5 w-4.5" aria-hidden /></span>
            <div className="min-w-0">
              <h2 id="brands-title" className="truncate text-sm font-black sm:text-base">{t.title}</h2>
              <p className="line-clamp-1 text-[10px] text-muted-foreground sm:text-xs">{t.subtitle}</p>
            </div>
          </div>
          <Link href="/brands" className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-border bg-background px-3 py-1.5 text-[10px] font-bold text-muted-foreground transition hover:border-primary/30 hover:text-primary sm:text-xs">{t.viewAll}<ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden /></Link>
        </div>

        <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-5 sm:gap-4 lg:grid-cols-10">
          {result.items.map((store) => (
            <Link key={store.id} href={`/store/${store.id}` as never} aria-label={store.shopName} className="group flex min-w-0 flex-col items-center gap-1.5 rounded-2xl p-1 text-center transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-border bg-background shadow-sm ring-2 ring-background transition-[transform,box-shadow,border-color] group-hover:scale-105 group-hover:border-primary/30 group-hover:shadow-md sm:h-14 sm:w-14">
                {store.logoUrl ? <Image src={store.logoUrl} alt="" fill sizes="56px" className="object-cover" /> : <span className="text-sm font-black text-primary">{store.shopName.charAt(0)}</span>}
                <span className="absolute -end-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-background bg-emerald-500 text-white shadow-sm"><BadgeCheck className="h-2.5 w-2.5" aria-hidden /></span>
              </span>
              <span className="w-full truncate text-[9px] font-bold text-foreground group-hover:text-primary sm:text-[10px]">{store.shopName}</span>
              <span className="text-[8px] text-muted-foreground sm:text-[9px]">{t.brand}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
