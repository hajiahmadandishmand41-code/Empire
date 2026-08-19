import { getLocale } from 'next-intl/server';
import { ProductSliderSection } from './product-slider-section';
import type { SliderProduct } from './product-slider-section';
import { getHomepageData, toSliderProduct } from '../lib/homepage-data';

async function getNewArrivals(): Promise<SliderProduct[]> {
  const data = await getHomepageData();
  return data.newest.map((product) => toSliderProduct(product, 'new'));
}

export async function NewArrivalsSection() {
  const locale = await getLocale();
  const products = await getNewArrivals();

  return (
    <ProductSliderSection
      title="جدیدترین محصولات"
      subtitle="تازه‌ترین کالاهای اضافه‌شده به فروشگاه"
      viewAllHref="/shop?sort=newest"
      accentColor="bg-cyan-500"
      products={products}
      locale={locale}
      currency="AFN"
    />
  );
}
