import { getLocale, getTranslations } from 'next-intl/server';
import { ProductSliderSection } from './product-slider-section';
import type { SliderProduct } from './product-slider-section';
import { getHomepageData, toSliderProduct } from '../lib/homepage-data';

async function getBestSellers(): Promise<SliderProduct[]> {
  const data = await getHomepageData();
  return data.bestSelling.map((product) => toSliderProduct(product, 'best'));
}

export async function BestSellersSection() {
  const locale = await getLocale();
  const t = await getTranslations('home.sections').catch(() => null);
  const products = await getBestSellers();

  return (
    <ProductSliderSection
      title={t ? t('bestSellers.title') : 'پرفروش‌ترین‌ها'}
      subtitle={t ? t('bestSellers.subtitle') : 'محصولات پرفروش این ماه'}
      viewAllHref="/shop?sort=bestSelling"
      accentColor="bg-amber-500"
      products={products}
      locale={locale}
      currency="AFN"
    />
  );
}
