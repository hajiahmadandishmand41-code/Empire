import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { getProductService } from '@/server/infrastructure/registry';
import type { ProductSummary } from '@/types';

function getCopy(locale: string) {
  if (locale === 'en') return {
    badge: 'Made in Afghanistan',
    title: 'Local & Traditional Products',
    subtitle: 'Discover authentic local products from Afghan sellers.',
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
    subtitle: 'محصولات اصیل فروشندگان وطنی افغانستان را کشف کنید.',
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
    <section aria-labelledby="traditional-products-banner-title" className="mx-auto max-w-screen-xl px-3 py-4 sm:px-6 sm:py-6">
      <Link href="/traditional" className="group relative block overflow-hidden rounded-3xl border border-border bg-card shadow-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
        <div className="grid min-h-[190px] md:grid-cols-[1.1fr_.9fr]">
          <div className="relative z-10 flex flex-col justify-center p-5 sm:p-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-extrabold text-primary">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              <span>{text.badge}</span>
            </div>
            <h2 id="traditional-products-banner-title" className="mt-3 max-w-xl text-2xl font-black tracking-tight text-foreground sm:text-3xl">{text.title}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{text.subtitle}</p>
            <span className="mt-5 inline-flex min-h-10 w-fit items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold text-primary-foreground shadow-sm transition-transform group-hover:-translate-y-0.5">
              {text.cta}<ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </span>
          </div>
          <div className="relative min-h-[180px] overflow-hidden bg-muted">
            {image ? <Image src={image} alt={products[0]?.name ?? text.title} fill sizes="(max-width: 767px) 100vw, 42vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" /> : <div className="h-full w-full bg-gradient-to-br from-muted to-accent" aria-hidden />}
            <div className="absolute inset-0 bg-gradient-to-r from-card via-card/20 to-transparent rtl:bg-gradient-to-l" />
          </div>
        </div>
      </Link>
    </section>
  );
}
