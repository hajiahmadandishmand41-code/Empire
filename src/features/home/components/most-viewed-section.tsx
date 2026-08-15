import { getLocale, getTranslations } from 'next-intl/server';
import { ProductSliderSection } from './product-slider-section';
import type { SliderProduct } from './product-slider-section';
import { getHomepageData, toSliderProduct } from '../lib/homepage-data';

async function getMostViewed(): Promise<SliderProduct[]> {
  const data = await getHomepageData();
  return data.mostViewed.map((product) => toSliderProduct(product));
}

export async function MostViewedSection() {
  const locale = await getLocale();
  const t = await getTranslations('home.sections').catch(() => null);
  const products = await getMostViewed();

  return (
    <ProductSliderSection
      title={t ? t('mostViewed.title') : 'پربازدیدترین‌ها'}
      subtitle={t ? t('mostViewed.subtitle') : 'محصولاتی که بیشتر دیده شده‌اند'}
      viewAllHref="/shop?sort=mostViewed"
      accentColor="bg-purple-500"
      products={products}
      locale={locale}
      currency="AFN"
    />
  );
}
