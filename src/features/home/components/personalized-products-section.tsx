'use client';

import * as React from 'react';
import { ProductSliderSection } from './product-slider-section';
import type { SliderProduct } from './product-slider-section';

const STORAGE_KEY = 'eshop_recent_products_v2';

type RecentProduct = { slug: string; categoryKey?: string | null; viewedAt: number };

function readRecentProducts(): RecentProduct[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem('empire_recent_products_v1');
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is RecentProduct => Boolean(item && typeof item === 'object' && typeof (item as RecentProduct).slug === 'string'))
      .sort((a, b) => b.viewedAt - a.viewedAt)
      .slice(0, 8);
  } catch {
    return [];
  }
}

function personalizedScore(product: SliderProduct, recent: RecentProduct[]): number {
  const recentBySlug = new Map(recent.map((item) => [item.slug, item]));
  const exact = recentBySlug.get(product.slug);
  const categoryRank = recent.findIndex((item) => item.categoryKey && item.categoryKey === product.categoryKey);
  const ageHours = exact ? Math.max(0, (Date.now() - exact.viewedAt) / 3_600_000) : 9999;
  const recencyBoost = exact ? Math.max(0, 120 - ageHours * 2.5) : 0;
  const categoryBoost = categoryRank >= 0 ? Math.max(0, 90 - categoryRank * 12) : 0;
  const salesBoost = Math.min(70, (product.salesCount ?? 0) / 20);
  const viewsBoost = Math.min(45, (product.viewCount ?? 0) / 200);
  const ratingBoost = Math.min(35, (product.rating ?? 0) * 7);
  const reviewBoost = Math.min(20, (product.reviewCount ?? 0) / 10);
  const freshBoost = product.badge === 'new' ? 12 : 0;
  const stockBoost = product.inStock === false ? -500 : 20;
  return exact ? 1000 + recencyBoost + categoryBoost + salesBoost + viewsBoost + ratingBoost + reviewBoost + freshBoost + stockBoost : categoryBoost + salesBoost + viewsBoost + ratingBoost + reviewBoost + freshBoost + stockBoost;
}

function selectPersonalized(products: SliderProduct[], recent: RecentProduct[]): SliderProduct[] {
  const ranked = [...products].sort((a, b) => personalizedScore(b, recent) - personalizedScore(a, recent));
  const chosen: SliderProduct[] = [];
  const categoryCounts = new Map<string, number>();
  for (const product of ranked) {
    const category = product.categoryKey ?? product.category?.name ?? 'other';
    const count = categoryCounts.get(category) ?? 0;
    if (count >= 3 && chosen.length < 6) continue;
    chosen.push(product);
    categoryCounts.set(category, count + 1);
    if (chosen.length >= 8) break;
  }
  return chosen;
}

export function PersonalizedProductsSection({ products, locale = 'fa', currency = 'AFN' }: { products: SliderProduct[]; locale?: string; currency?: string }) {
  const [recent, setRecent] = React.useState<RecentProduct[]>([]);

  React.useEffect(() => { setRecent(readRecentProducts()); }, []);

  const selected = selectPersonalized(products, recent);
  if (selected.length === 0) return null;

  const hasHistory = recent.length > 0;
  const title = locale === 'en' ? 'Picked for you' : locale === 'ps' ? 'ستاسو لپاره غوره شوي' : 'پیشنهاد مناسب شما';
  const subtitle = hasHistory
    ? locale === 'en' ? 'Your recent interests lead the ranking, with popular and highly rated products mixed in' : locale === 'ps' ? 'ستاسو وروستي شوقونه لومړیتوب لري او مشهور او لوړ امتیاز لرونکي محصولات هم ورسره ګډ شوي' : 'علاقه‌های اخیر شما اولویت دارند و محصولات محبوب و پُرامتیاز هم در رتبه‌بندی ترکیب می‌شوند'
    : locale === 'en' ? 'Popular, highly rated and fresh products form the starting ranking' : locale === 'ps' ? 'مشهور، لوړ امتیاز لرونکي او نوي محصولات د پیل درجه بندي جوړوي' : 'محبوب‌ترین، پُرامتیازترین و تازه‌ترین محصولات، رتبه‌بندی اولیه را می‌سازند';

  return <ProductSliderSection title={title} subtitle={subtitle} products={selected} locale={locale} currency={currency} accentColor="bg-violet-500" />;
}

export function RecentlyViewedSection({ products, locale = 'fa', currency = 'AFN' }: { products: SliderProduct[]; locale?: string; currency?: string }) {
  const [recent, setRecent] = React.useState<RecentProduct[]>([]);
  React.useEffect(() => { setRecent(readRecentProducts()); }, []);

  const bySlug = new Map(products.map((product) => [product.slug, product]));
  const selected = recent.map((item) => bySlug.get(item.slug)).filter(Boolean) as SliderProduct[];
  if (selected.length === 0) return null;

  const title = locale === 'en' ? 'Recently viewed' : locale === 'ps' ? 'وروستي لیدل شوي' : 'اخیراً مشاهده‌شده';
  const subtitle = locale === 'en' ? 'Continue where you left off' : locale === 'ps' ? 'له هغه ځایه دوام ورکړئ چې پاتې و' : 'از همان‌جایی که بودید ادامه دهید';
  return <ProductSliderSection title={title} subtitle={subtitle} products={selected.slice(0, 8)} locale={locale} currency={currency} accentColor="bg-slate-500" />;
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
