import Image from 'next/image';
import { ShieldCheck, Store } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { getSellerRepository } from '@/server/infrastructure/registry';

type Locale = 'fa' | 'ps' | 'en';

const copy = {
  fa: { title: 'فروشگاه‌های معتبر', viewAll: 'همه فروشگاه‌ها', verified: 'تأییدشده' },
  ps: { title: 'باوري پلورنځي', viewAll: 'ټول پلورنځي', verified: 'تایید شوی' },
  en: { title: 'Trusted stores', viewAll: 'View all stores', verified: 'Verified' },
} as const;

export async function TrustedStoreLogos({ locale }: { locale: Locale }) {
  const result = await getSellerRepository().findPublicMany({ q: '', page: 1, pageSize: 8 });
  if (!result.items.length) return null;
  const t = copy[locale];

  return (
    <section aria-labelledby="trusted-stores-title" className="border-b border-border bg-background py-5 sm:py-6">
      <div className="mx-auto max-w-screen-xl px-3 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Store className="h-4.5 w-4.5" aria-hidden />
            </span>
            <div>
              <h2 id="trusted-stores-title" className="text-sm font-black sm:text-base">{t.title}</h2>
              <p className="text-[10px] text-muted-foreground sm:text-xs">{t.verified}</p>
            </div>
          </div>
          <Link href="/stores" className="rounded-xl border border-border bg-card px-3 py-1.5 text-[10px] font-bold text-muted-foreground transition hover:border-primary/30 hover:text-primary sm:text-xs">
            {t.viewAll}
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-3 sm:grid-cols-8 sm:gap-4">
          {result.items.map((store) => (
            <Link
              key={store.id}
              href={`/store/${store.id}` as never}
              aria-label={store.shopName}
              title={store.shopName}
              className="group flex min-w-0 flex-col items-center gap-1.5 rounded-2xl p-1.5 transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-black/5 transition-[transform,box-shadow,border-color] group-hover:scale-105 group-hover:border-primary/30 group-hover:shadow-md sm:h-16 sm:w-16">
                {store.logoUrl ? (
                  <Image src={store.logoUrl} alt="" fill sizes="64px" className="object-cover" />
                ) : (
                  <span className="text-base font-black text-primary">{store.shopName.charAt(0)}</span>
                )}
                <span className="absolute -end-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-card bg-emerald-500 text-white shadow-sm">
                  <ShieldCheck className="h-2.5 w-2.5" aria-hidden />
                </span>
              </span>
              <span className="w-full truncate text-center text-[10px] font-bold text-foreground group-hover:text-primary sm:text-xs">{store.shopName}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
