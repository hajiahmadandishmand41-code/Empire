import { getLocale, getTranslations } from 'next-intl/server';
import { ProductSliderSection } from './product-slider-section';
import type { SliderProduct } from './product-slider-section';
import { getHomepageData, toSliderProduct } from '../lib/homepage-data';

async function getPopularProducts(): Promise<SliderProduct[]> {
  const data = await getHomepageData();
  return data.popular.map((product) => toSliderProduct(product));
}

export async function PopularProductsSection() {
  const locale = await getLocale();
  const t = await getTranslations('home.sections').catch(() => null);
  const products = await getPopularProducts();

  return (
    <ProductSliderSection
      title={t ? t('popular.title') : 'محبوب‌ترین‌ها'}
      subtitle={t ? t('popular.subtitle') : 'پرطرفدار در سراسر افغانستان'}
      viewAllHref="/shop?sort=popular"
      accentColor="bg-indigo-500"
      products={products}
      locale={locale}
      currency="AFN"
    />
  );
}
