import { ArrowLeft, Baby, BookOpen, Dumbbell, Home, ShoppingBag, Shirt, Smartphone, Sparkles, Watch, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { AllCategoriesGrid } from '@/features/home/components/all-categories-grid';

const items: Array<{ key: string; icon: LucideIcon; href: string; fa: string; ps: string; en: string }> = [
  { key: 'clothing', icon: Shirt, href: '/shop?categoryKey=clothing', fa: 'پوشاک', ps: 'جامې', en: 'Clothing' },
  { key: 'digital', icon: Smartphone, href: '/shop?categoryKey=digital', fa: 'موبایل و دیجیتال', ps: 'موبایل او ډیجیټل', en: 'Mobile & Digital' },
  { key: 'homeAppliances', icon: Home, href: '/shop?categoryKey=homeAppliances', fa: 'خانه و آشپزخانه', ps: 'کور او پخلنځی', en: 'Home & Kitchen' },
  { key: 'beauty', icon: Sparkles, href: '/shop?categoryKey=beauty', fa: 'بهداشت و زیبایی', ps: 'روغتیا او ښکلا', en: 'Beauty & Care' },
  { key: 'sports', icon: Dumbbell, href: '/shop?categoryKey=sports', fa: 'ورزش', ps: 'ورزش', en: 'Sports' },
  { key: 'footwear', icon: ShoppingBag, href: '/shop?categoryKey=footwear', fa: 'کفش و کیف', ps: 'بوټان او بکسونه', en: 'Footwear & Bags' },
  { key: 'baby', icon: Baby, href: '/shop?categoryKey=baby', fa: 'کودک و نوزاد', ps: 'ماشومان', en: 'Baby & Kids' },
  { key: 'books', icon: BookOpen, href: '/shop?categoryKey=books', fa: 'کتاب و آموزش', ps: 'کتابونه او زده کړه', en: 'Books & Learning' },
  { key: 'electronics', icon: Zap, href: '/shop?categoryKey=electronics', fa: 'لوازم الکترونیکی', ps: 'برېښنایي وسایل', en: 'Electronics' },
  { key: 'watches', icon: Watch, href: '/shop?categoryKey=watches', fa: 'ساعت و اکسسوری', ps: 'ساعتونه او لوازم', en: 'Watches & Accessories' },
];

export default async function CategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const title = locale === 'en' ? 'All categories' : locale === 'ps' ? 'ټولې کټګورۍ' : 'همه دسته‌بندی‌ها';
  const subtitle = locale === 'en' ? 'Find your next product in one clear marketplace directory.' : locale === 'ps' ? 'خپل محصول په یوه ساده او منظم بازار کې پیدا کړئ.' : 'همه دسته‌ها را در یک مسیر ساده، مرتب و قابل جستجو پیدا کنید.';
  const placeholder = locale === 'en' ? 'Search categories…' : locale === 'ps' ? 'کټګورۍ ولټوئ…' : 'جستجوی دسته‌ها…';
  const back = locale === 'en' ? 'Back to home' : locale === 'ps' ? 'بېرته کور ته' : 'بازگشت به خانه';

  return <div className="min-h-dvh bg-background"><SiteHeader /><main id="main" className="pb-16 md:pb-0"><section className="border-b border-border bg-card"><div className="mx-auto max-w-screen-xl px-3 py-7 sm:px-6 sm:py-10"><Link href="/" className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary"><ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />{back}</Link><h1 className="text-2xl font-black tracking-tight text-foreground sm:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{subtitle}</p></div></section><section className="mx-auto max-w-screen-xl px-3 py-6 sm:px-6 sm:py-8"><AllCategoriesGrid items={items} locale={locale} placeholder={placeholder} /></section></main><SiteFooter /><BottomNavigation /></div>;
}
