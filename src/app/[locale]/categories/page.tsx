import { ArrowLeft, Baby, BookOpen, Dumbbell, Home, ShoppingBag, Shirt, Smartphone, Sparkles, Watch, Zap } from 'lucide-react';
import type { ComponentType } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { AllCategoriesGrid } from '@/features/home/components/all-categories-grid';

type CategoryKey = 'clothing' | 'digital' | 'homeAppliances' | 'beauty' | 'sports' | 'footwear' | 'baby' | 'books' | 'electronics' | 'watches';
type CategoryItem = { key: CategoryKey; iconKey: CategoryKey; href: string; fa: string; ps: string; en: string };

const iconMap: Record<CategoryKey, ComponentType<{ className?: string }>> = {
  clothing: Shirt, digital: Smartphone, homeAppliances: Home, beauty: Sparkles, sports: Dumbbell,
  footwear: ShoppingBag, baby: Baby, books: BookOpen, electronics: Zap, watches: Watch,
};

const labels: Record<CategoryKey, { fa: string; ps: string; en: string; href: string }> = {
  clothing: { fa: 'پوشاک', ps: 'جامې', en: 'Clothing', href: '/shop?categoryKey=clothing' },
  digital: { fa: 'موبایل و دیجیتال', ps: 'موبایل او ډیجیټل', en: 'Mobile & Digital', href: '/shop?categoryKey=digital' },
  homeAppliances: { fa: 'خانه و آشپزخانه', ps: 'کور او پخلنځی', en: 'Home & Kitchen', href: '/shop?categoryKey=homeAppliances' },
  beauty: { fa: 'بهداشت و زیبایی', ps: 'روغتیا او ښکلا', en: 'Beauty & Care', href: '/shop?categoryKey=beauty' },
  sports: { fa: 'ورزش', ps: 'ورزش', en: 'Sports', href: '/shop?categoryKey=sports' },
  footwear: { fa: 'کفش و کیف', ps: 'بوټان او بکسونه', en: 'Footwear & Bags', href: '/shop?categoryKey=footwear' },
  baby: { fa: 'کودک و نوزاد', ps: 'ماشومان', en: 'Baby & Kids', href: '/shop?categoryKey=baby' },
  books: { fa: 'کتاب و آموزش', ps: 'کتابونه او زده کړه', en: 'Books & Learning', href: '/shop?categoryKey=books' },
  electronics: { fa: 'لوازم الکترونیکی', ps: 'برېښنایي وسایل', en: 'Electronics', href: '/shop?categoryKey=electronics' },
  watches: { fa: 'ساعت و اکسسوری', ps: 'ساعتونه او لوازم', en: 'Watches & Accessories', href: '/shop?categoryKey=watches' },
};

const items: CategoryItem[] = Object.entries(labels).map(([key, value]) => ({ key: key as CategoryKey, iconKey: key as CategoryKey, ...value }));

export default async function CategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const title = locale === 'en' ? 'All categories' : locale === 'ps' ? 'ټولې کټګورۍ' : 'همه دسته‌بندی‌ها';
  const subtitle = locale === 'en' ? 'Find your next product in one clear marketplace directory.' : locale === 'ps' ? 'خپل محصول په یوه ساده او منظم بازار کې پیدا کړئ.' : 'همه دسته‌ها را در یک مسیر ساده، مرتب و قابل جستجو پیدا کنید.';
  const placeholder = locale === 'en' ? 'Search categories…' : locale === 'ps' ? 'کټګورۍ ولټوئ…' : 'جستجوی دسته‌ها…';
  const back = locale === 'en' ? 'Back to home' : locale === 'ps' ? 'بېرته کور ته' : 'بازگشت به خانه';

  void iconMap;
  return <div className="min-h-dvh bg-background"><SiteHeader /><main id="main" className="pb-16 md:pb-0"><section className="border-b border-border bg-card"><div className="mx-auto max-w-screen-xl px-3 py-7 sm:px-6 sm:py-10"><Link href="/" className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary"><ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />{back}</Link><h1 className="text-2xl font-black tracking-tight text-foreground sm:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{subtitle}</p></div></section><section className="mx-auto max-w-screen-xl px-3 py-6 sm:px-6 sm:py-8"><AllCategoriesGrid items={items} locale={locale} placeholder={placeholder} /></section></main><SiteFooter /><BottomNavigation /></div>;
}
