import { getLocale, getTranslations } from 'next-intl/server';
import { ProductSliderSection } from './product-slider-section';
import type { SliderProduct } from './product-slider-section';
import { Zap } from 'lucide-react';
import { getHomepageData, toSliderProduct } from '../lib/homepage-data';

async function getSpecialOffers(): Promise<SliderProduct[]> {
  const data = await getHomepageData();
  return data.featured
    .filter((product) => product.badge === 'sale' || Boolean(product.comparePrice && product.comparePrice > product.price))
    .map((product) => toSliderProduct(product, 'sale'));
}

export async function SpecialOffersSection() {
  const locale = await getLocale();
  const t = await getTranslations('home.sections').catch(() => null);
  const products = await getSpecialOffers();

  const title = t ? t('specialOffers.title') : 'پیشنهادات ویژه';
  const subtitle = t ? t('specialOffers.subtitle') : 'فقط برای مدت محدود';

  return (
    <section className="bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border-b border-rose-100 dark:border-rose-900/40">
      <div className="mx-auto max-w-screen-xl px-3 sm:px-6 pt-6 sm:pt-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-1.5">
            <Zap className="h-3.5 w-3.5 text-white" aria-hidden />
            <span className="text-sm font-extrabold text-white">{title}</span>
          </div>
          <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">{subtitle}</p>
        </div>
      </div>
      <ProductSliderSection
        title={title}
        subtitle={subtitle}
        viewAllHref="/shop?badge=sale"
        accentColor="bg-rose-600"
        products={products}
        locale={locale}
        currency="AFN"
      />
    </section>
  );
}
