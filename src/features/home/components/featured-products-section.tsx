import { getTranslations } from 'next-intl/server';
import { getLocale } from 'next-intl/server';
import { ProductSliderSection } from './product-slider-section';
import type { SliderProduct } from './product-slider-section';
import { getHomepageData, toSliderProduct } from '../lib/homepage-data';

async function getFeaturedProducts(): Promise<SliderProduct[]> {
  const data = await getHomepageData();
  return data.featured.map((product) => toSliderProduct(product));
}

export async function FeaturedProductsSection() {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations('home.featured'),
  ]);
  const products = await getFeaturedProducts();

  return (
    <ProductSliderSection
      title={t('sectionTitle')}
      subtitle={t('sectionSubtitle')}
      viewAllHref="/shop?featured=true"
      accentColor="bg-rose-500"
      products={products}
      locale={locale}
      currency="AFN"
    />
  );
}
