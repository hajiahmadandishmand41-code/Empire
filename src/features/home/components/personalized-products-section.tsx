'use client';

import * as React from 'react';
import { ProductSliderSection } from './product-slider-section';
import type { SliderProduct } from './product-slider-section';

const STORAGE_KEY = 'empire_recent_products_v1';

type RecentProduct = { slug: string; categoryKey?: string | null; viewedAt: number };

function readRecentProducts(): RecentProduct[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is RecentProduct => Boolean(item && typeof item === 'object' && typeof (item as RecentProduct).slug === 'string'))
      .slice(0, 8);
  } catch {
    return [];
  }
}

export function PersonalizedProductsSection({
  products,
  locale = 'fa',
  currency = 'AFN',
}: {
  products: SliderProduct[];
  locale?: string;
  currency?: string;
}) {
  const [recent, setRecent] = React.useState<RecentProduct[]>([]);

  React.useEffect(() => {
    setRecent(readRecentProducts());
  }, []);

  const recentCategories = new Set(recent.map((item) => item.categoryKey).filter(Boolean));
  const personalized = recentCategories.size
    ? products.filter((product) => product.category?.name && recentCategories.has(product.category.name)).slice(0, 8)
    : [];
  const selected = personalized.length >= 3 ? personalized : products.slice(0, 8);

  if (selected.length === 0) return null;

  const title = locale === 'en' ? 'Picked for you' : locale === 'ps' ? 'ستاسو لپاره غوره شوي' : 'پیشنهاد مناسب شما';
  const subtitle = recentCategories.size
    ? locale === 'en'
      ? 'Based on what you recently explored'
      : locale === 'ps'
        ? 'ستاسو د وروستیو لیدنو پر بنسټ'
        : 'بر اساس چیزهایی که اخیراً دیده‌اید'
    : locale === 'en'
      ? 'A smart starting point from popular products'
      : locale === 'ps'
        ? 'د مشهورو محصولاتو څخه هوښیار پیل'
        : 'یک شروع هوشمند بر اساس محصولات محبوب';

  return (
    <ProductSliderSection
      title={title}
      subtitle={subtitle}
      products={selected}
      locale={locale}
      currency={currency}
      accentColor="bg-violet-500"
    />
  );
}

export function rememberViewedProduct(product: RecentProduct): void {
  try {
    const current = readRecentProducts().filter((item) => item.slug !== product.slug);
    const next = [{ ...product, viewedAt: Date.now() }, ...current].slice(0, 8);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage is an optimization, never a critical dependency.
  }
}
