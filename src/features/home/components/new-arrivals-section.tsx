import { getLocale, getTranslations } from 'next-intl/server';
import { ProductSliderSection } from './product-slider-section';
import type { SliderProduct } from './product-slider-section';
import { getHomepageData, toSliderProduct } from '../lib/homepage-data';

async function getNewArrivals(): Promise<SliderProduct[]> {
  const data = await getHomepageData();
  return data.newest.map((product) => toSliderProduct(product, 'new'));
}

export async function NewArrivalsSection() {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations('home.sections').catch(() => null),
  ]);
  const products = await getNewArrivals();

  const fallback = locale === 'en'
    ? { title: 'New arrivals', subtitle: 'The latest products added to the marketplace' }
    : locale === 'ps'
      ? { title: 'نوي محصولات', subtitle: 'د بازار وروستي اضافه شوي محصولات' }
      : { title: 'جدیدترین محصولات', subtitle: 'تازه‌ترین کالاهای اضافه‌شده به فروشگاه' };

  let title = fallback.title;
  let subtitle = fallback.subtitle;
  if (t) {
    try { title = t('newest.title' as never); } catch { /* fallback */ }
    try { subtitle = t('newest.subtitle' as never); } catch { /* fallback */ }
  }

  return (
    <ProductSliderSection
      title={title}
      subtitle={subtitle}
      viewAllHref="/shop?sort=newest"
      accentColor="bg-cyan-500"
      products={products}
      locale={locale}
      currency="AFN"
    />
  );
}
