import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Grid } from '@/components/layout/grid';
import { Stack } from '@/components/layout/stack';
import type { ProductSummary } from '@/types';
import { ShopProductCard } from '@/features/shop/components/shop-product-card';

interface RelatedProductsProps {
  products: ProductSummary[];
  locale: string;
  currency?: string;
}

export function RelatedProducts({ products, locale, currency = 'AFN' }: RelatedProductsProps) {
  const t = useTranslations('product.related');
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="related-title">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-1 rounded-full bg-rose-500" aria-hidden />
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-rose-500">{t('eyebrow')}</p>
            <h2
              id="related-title"
              className="font-display text-lg font-bold text-foreground sm:text-xl"
            >
              {t('title')}
            </h2>
          </div>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs font-medium text-rose-500 hover:text-rose-600"
        >
          مشاهده بیشتر
          <ArrowRight className="icon-directional h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      <Grid cols={2} sm={2} lg={3} gap="3" className="sm:gap-4">
        {products.map((product) => (
          <ShopProductCard
            key={product.slug}
            product={product}
            locale={locale}
            currency={currency}
          />
        ))}
      </Grid>
    </section>
  );
}
