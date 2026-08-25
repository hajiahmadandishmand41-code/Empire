import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { getProductService } from '@/server/infrastructure/registry';
import type { ProductSummary } from '@/types';

function getCopy(locale: string) {
  if (locale === 'en') return {
    badge: 'Made in Afghanistan',
    title: 'Local & Traditional Products',
    subtitle: 'Authentic local products from Afghan sellers.',
    cta: 'Explore local products',
  };
  if (locale === 'ps') return {
    badge: 'په افغانستان کې جوړ شوي',
    title: 'کورني او دودیز محصولات',
    subtitle: 'د افغان پلورونکو اصلي کورني محصولات ومومئ.',
    cta: 'کورني محصولات وګورئ',
  };
  return {
    badge: 'ساخته‌شده در افغانستان',
    title: 'محصولات وطنی و سنتی',
    subtitle: 'محصولات اصیل فروشندگان وطنی افغانستان.',
    cta: 'مشاهده محصولات وطنی',
  };
}

function firstImage(products: ProductSummary[]): string | null {
  for (const product of products) {
    const image = product.images.find((item) => item.src)?.src;
    if (image) return image;
  }
  return null;
}

export async function TraditionalProductsBanner({ locale = 'fa' }: { locale?: string }) {
  let products: ProductSummary[] = [];
  try {
    products = (await getProductService().listProducts({
      isTraditional: true,
      page: 1,
      pageSize: 6,
      sort: 'bestSelling',
      isActive: true,
    })).products;
  } catch {
    return null;
  }

  if (products.length === 0) return null;

  const text = getCopy(locale);
  const image = firstImage(products);

  return (
    <section aria-labelledby="traditional-products-banner-title" className="mx-auto max-w-screen-xl px-3 py-2 sm:px-6 sm:py-3">
      <Link href="/traditional" className="group relative block h-[112px] overflow-hidden rounded-2xl border border-border bg-slate-950 shadow-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:h-[150px] sm:rounded-3xl">
        {image ? <Image src={image} alt={products[0]?.name ?? text.title} fill sizes="(max-width: 767px) 100vw, 1200px" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" /> : null}
        <div className="absolute inset-0 bg-gradient-to-l from-slate-950/90 via-slate-950/55 to-slate-950/15" aria-hidden="true" />
        <div className="absolute inset-y-0 end-0 flex max-w-[78%] flex-col justify-center p-3 text-white sm:max-w-[62%] sm:p-5" dir={locale === 'en' ? 'ltr' : 'rtl'}>
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[7px] font-extrabold backdrop-blur-md sm:px-2.5 sm:py-1 sm:text-[9px]">
            <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" aria-hidden />
            <span>{text.badge}</span>
          </div>
          <h2 id="traditional-products-banner-title" className="mt-1.5 text-base font-black tracking-tight sm:text-xl">{text.title}</h2>
          <p className="mt-0.5 line-clamp-1 text-[8px] leading-3.5 text-white/75 sm:text-[11px] sm:leading-4">{text.subtitle}</p>
          <span className="mt-2 inline-flex min-h-7 w-fit items-center gap-1 rounded-full bg-white px-2.5 py-1.5 text-[9px] font-extrabold text-slate-900 shadow-sm sm:min-h-8 sm:px-3 sm:py-1.5 sm:text-[10px]">
            {text.cta}<ArrowLeft className="h-3 w-3 rtl:rotate-180" aria-hidden />
          </span>
        </div>
      </Link>
    </section>
  );
}
