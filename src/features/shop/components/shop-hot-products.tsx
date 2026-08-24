import Image from 'next/image';
import Link from 'next/link';
import { Flame, ArrowLeft } from 'lucide-react';
import { getProductService } from '@/server/infrastructure/registry';
import type { ProductSummary } from '@/types';

type Locale = 'fa' | 'ps' | 'en';

const copy = {
  fa: { title: 'داغ‌ترین محصولات', sub: 'محصولات محبوب با رتبه‌بندی زنده', home: 'وسایل خانه', smart: 'وسایل هوشمند', all: 'همه', rank: 'رتبه' },
  ps: { title: 'تر ټولو ګرم محصولات', sub: 'د شهرت پر بنسټ تازه درجه بندي', home: 'د کور وسایل', smart: 'هوښیار وسایل', all: 'ټول', rank: 'رتبه' },
  en: { title: 'Hottest products', sub: 'Live-ranked popular picks', home: 'Home essentials', smart: 'Smart devices', all: 'View all', rank: 'Rank' },
} as const;

function HotRow({ product, index, locale }: { product: ProductSummary; index: number; locale: Locale }) {
  const image = product.images?.[0]?.src ?? null;
  const price = new Intl.NumberFormat(locale === 'en' ? 'en-US' : locale === 'ps' ? 'ps-AF' : 'fa-IR').format(product.price);
  return (
    <Link href={`/shop/${product.slug}` as never} className="group flex min-w-0 items-center gap-2 rounded-xl border border-border/70 bg-card px-2 py-1.5 shadow-sm transition hover:-translate-y-px hover:border-primary/25 hover:shadow-md">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-black text-primary-foreground" aria-label={`${copy[locale].rank} ${index + 1}`}>{index + 1}</span>
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
        {image ? <Image src={image} alt={product.images?.[0]?.alt || product.name} fill sizes="56px" className="object-cover" /> : null}
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <h3 className="line-clamp-2 text-[10px] font-bold leading-4 text-foreground group-hover:text-primary sm:text-[11px]">{product.name}</h3>
        <p className="mt-0.5 truncate text-[9px] text-muted-foreground">{product.sellerShopName || product.region}</p>
        <p className="mt-0.5 text-[10px] font-black text-primary">{price} ؋</p>
      </div>
      <ArrowLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground rtl:rotate-180" aria-hidden="true" />
    </Link>
  );
}

function HotCategory({ title, products, href, locale }: { title: string; products: ProductSummary[]; href: string; locale: Locale }) {
  if (!products.length) return null;
  return (
    <section className="rounded-2xl border border-border bg-card/70 p-2.5 sm:p-3" aria-label={title}>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h3 className="text-xs font-black sm:text-sm">{title}</h3>
        <Link href={href as never} className="inline-flex min-h-7 items-center gap-1 rounded-full border border-border bg-background px-2.5 text-[9px] font-bold text-muted-foreground hover:text-primary sm:text-[10px]">
          {copy[locale].all}
        </Link>
      </div>
      <div className="space-y-1.5">
        {products.slice(0, 3).map((product, index) => <HotRow key={product.id} product={product} index={index} locale={locale} />)}
      </div>
    </section>
  );
}

export async function ShopHotProducts({ locale }: { locale: Locale }) {
  const [home, smart] = await Promise.all([
    getProductService().listProducts({ categoryKey: 'homeAppliances', isTraditional: false, sort: 'popular', page: 1, pageSize: 3, isActive: true }),
    getProductService().listProducts({ categoryKey: 'digital', isTraditional: false, sort: 'popular', page: 1, pageSize: 3, isActive: true }),
  ]);

  if (!home.products.length && !smart.products.length) return null;
  const t = copy[locale];

  return (
    <section className="border-t border-border bg-background py-3 sm:py-5" aria-label={t.title}>
      <div className="mx-auto max-w-screen-xl px-3 sm:px-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary"><Flame className="h-4 w-4" aria-hidden="true" /></span>
          <div>
            <h2 className="text-sm font-black sm:text-base">{t.title}</h2>
            <p className="text-[9px] text-muted-foreground sm:text-[11px]">{t.sub}</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <HotCategory title={t.home} products={home.products} href="/shop?categoryKey=homeAppliances&sort=popular" locale={locale} />
          <HotCategory title={t.smart} products={smart.products} href="/shop?categoryKey=digital&sort=popular" locale={locale} />
        </div>
      </div>
    </section>
  );
}
