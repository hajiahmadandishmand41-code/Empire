import { getLocale, getTranslations } from 'next-intl/server';
import { ProductSliderSection } from './product-slider-section';
import type { SliderProduct } from './product-slider-section';
import { getHomepageData, toSliderProduct } from '../lib/homepage-data';

async function getNewProducts(): Promise<SliderProduct[]> {
  const data = await getHomepageData();
  return data.newest.map((product) => toSliderProduct(product, 'new'));
}

export async function NewProductsSection() {
  const locale = await getLocale();
  const t = await getTranslations('home.sections').catch(() => null);
  const products = await getNewProducts();

  return (
    <ProductSliderSection
      title={t ? t('newProducts.title') : 'جدیدترین‌ها'}
      subtitle={t ? t('newProducts.subtitle') : 'تازه‌ترین محصولات اضافه‌شده'}
      viewAllHref="/shop?sort=newest"
      accentColor="bg-blue-500"
      products={products}
      locale={locale}
      currency="AFN"
    />
  );
}
