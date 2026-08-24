import { getLocale, getTranslations } from 'next-intl/server';
import { ProductSliderSection } from './product-slider-section';
import type { SliderProduct } from './product-slider-section';
import { getHomepageSection, toSliderProduct } from '../lib/homepage-data';

function getUtcDayIndex(date = new Date()): number {
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000);
}

async function getPopularProducts(): Promise<SliderProduct[]> {
  const candidates = await getHomepageSection('mostViewed', 30);
  if (candidates.length <= 10) return candidates.map((product) => toSliderProduct(product));

  // Pick a fresh 10-product slice each day from the top 30 most-viewed active products.
  // The ranking itself is driven by current view counts; the daily offset prevents the
  // same ten products from occupying this section every day.
  const offset = (getUtcDayIndex() * 10) % candidates.length;
  const daily = [...candidates.slice(offset), ...candidates.slice(0, offset)].slice(0, 10);
  return daily.map((product) => toSliderProduct(product));
}

export async function PopularProductsSection() {
  const locale = await getLocale();
  const t = await getTranslations('home.sections').catch(() => null);
  const products = await getPopularProducts();

  return (
    <ProductSliderSection
      title={t ? t('popular.title') : 'محصولات محبوب ایشاپ'}
      subtitle={t ? t('popular.subtitle') : '۱۰ محصول پربازدید امروز'}
      viewAllHref="/shop?sort=mostViewed"
      accentColor="bg-indigo-500"
      products={products}
      locale={locale}
      currency="AFN"
    />
  );
}
