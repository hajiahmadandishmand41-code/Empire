/**
 * Showcase (design-preview) data.
 *
 * IMPORTANT: this is a *presentation* fallback, not a data source. It is used
 * only when no database is configured — i.e. in a local/preview environment
 * where `isDatabaseConfigured()` is false. As soon as `DATABASE_URL` (or any
 * of the Supabase/Vercel Postgres variables) is set, every one of these
 * helpers returns empty and the real repositories take over, so production
 * can never accidentally serve fake products.
 *
 * Its purpose is to make the homepage layout reviewable: without it, every
 * data-driven band renders `null` and the page collapses to a header, a hero
 * and a footer, which makes design work impossible to evaluate.
 */
import { isDatabaseConfigured } from '@/lib/db';
import type { CategoryKey, ProductSummary } from '@/types';

export function isShowcaseMode(): boolean {
  return !isDatabaseConfigured();
}

type Locale = 'fa' | 'ps' | 'en';

type Seed = {
  slug: string;
  name: Record<Locale, string>;
  categoryKey: CategoryKey;
  price: number;
  comparePrice?: number;
  rating: number;
  reviewCount: number;
  salesCount: number;
  shop: Record<Locale, string>;
  brand: Record<Locale, string>;
  region: Record<Locale, string>;
  badge?: ProductSummary['badge'];
  inStock?: boolean;
};

const SEEDS: Seed[] = [
  { slug: 'saffron-premium-1g', name: { fa: 'زعفران سرگل درجه یک هرات — ۱ گرم', ps: 'د هرات لومړي درجه زعفران — ۱ ګرام', en: 'Premium Herat saffron — 1g' }, categoryKey: 'homeAppliances', price: 890, comparePrice: 1200, rating: 4.8, reviewCount: 312, salesCount: 1840, shop: { fa: 'زعفران هرات', ps: 'د هرات زعفران', en: 'Herat Saffron' }, brand: { fa: 'طلای سرخ', ps: 'سره سره', en: 'Red Gold' }, region: { fa: 'هرات', ps: 'هرات', en: 'Herat' }, badge: 'best' },
  { slug: 'pistachio-badghis-1kg', name: { fa: 'پسته خندان بادغیس — ۱ کیلوگرم', ps: 'د بادغیس پستې — ۱ کیلو', en: 'Badghis pistachios — 1kg' }, categoryKey: 'homeAppliances', price: 1450, comparePrice: 1850, rating: 4.7, reviewCount: 208, salesCount: 1290, shop: { fa: 'خشکبار کابل', ps: 'د کابل وچې مېوې', en: 'Kabul Nuts' }, brand: { fa: 'مزه وطن', ps: 'د وطن خوند', en: 'Vatan Taste' }, region: { fa: 'بادغیس', ps: 'بادغیس', en: 'Badghis' }, badge: 'sale' },
  { slug: 'handwoven-carpet-2x3', name: { fa: 'قالین دستباف ترکمنی — ۲×۳ متر', ps: 'د ترکمن لاسي قالین — ۲×۳ متره', en: 'Handwoven Turkmen carpet — 2×3m' }, categoryKey: 'homeAppliances', price: 24500, comparePrice: 31000, rating: 4.9, reviewCount: 96, salesCount: 240, shop: { fa: 'قالین‌بافی اندخوی', ps: 'د اندخوی قالین', en: 'Andkhoy Carpets' }, brand: { fa: 'نقش کهن', ps: 'زوړ نقش', en: 'Naqsh Kohan' }, region: { fa: 'فاریاب', ps: 'فاریاب', en: 'Faryab' }, badge: 'best' },
  { slug: 'lapis-lazuli-pendant', name: { fa: 'گردنبند لاجورد بدخشان با نقره', ps: 'د بدخشان لاجورد غاړکۍ', en: 'Badakhshan lapis silver pendant' }, categoryKey: 'watches', price: 3200, comparePrice: 4100, rating: 4.6, reviewCount: 143, salesCount: 620, shop: { fa: 'سنگ و نقره', ps: 'ډبره او سپین زر', en: 'Stone & Silver' }, brand: { fa: 'لاجورد', ps: 'لاجورد', en: 'Lajward' }, region: { fa: 'بدخشان', ps: 'بدخشان', en: 'Badakhshan' }, badge: 'new' },
  { slug: 'wireless-earbuds-pro', name: { fa: 'ایرفون بی‌سیم پرو با نویز کنسلینگ', ps: 'بې سیمه غوږۍ پرو', en: 'Wireless earbuds Pro — ANC' }, categoryKey: 'digital', price: 2850, comparePrice: 3900, rating: 4.4, reviewCount: 527, salesCount: 2310, shop: { fa: 'دیجیتال کابل', ps: 'ډیجیټل کابل', en: 'Kabul Digital' }, brand: { fa: 'ساندکس', ps: 'ساندکس', en: 'Soundex' }, region: { fa: 'کابل', ps: 'کابل', en: 'Kabul' }, badge: 'sale' },
  { slug: 'smart-watch-s9', name: { fa: 'ساعت هوشمند S9 با صفحه AMOLED', ps: 'سمارټ ساعت S9', en: 'Smart watch S9 — AMOLED' }, categoryKey: 'watches', price: 4600, comparePrice: 5900, rating: 4.5, reviewCount: 389, salesCount: 1470, shop: { fa: 'دیجیتال کابل', ps: 'ډیجیټل کابل', en: 'Kabul Digital' }, brand: { fa: 'تک‌لاین', ps: 'ټیک لاین', en: 'Techline' }, region: { fa: 'کابل', ps: 'کابل', en: 'Kabul' }, badge: 'new' },
  { slug: 'afghan-chapan-coat', name: { fa: 'چپن سنتی افغانی ابریشمی', ps: 'دودیز افغاني چپن', en: 'Traditional Afghan chapan' }, categoryKey: 'clothing', price: 5400, comparePrice: 6800, rating: 4.8, reviewCount: 174, salesCount: 430, shop: { fa: 'پوشاک وطنی', ps: 'وطني جامې', en: 'Vatan Clothing' }, brand: { fa: 'ابریشم', ps: 'وریښم', en: 'Abrisham' }, region: { fa: 'مزار شریف', ps: 'مزار شریف', en: 'Mazar-i-Sharif' }, badge: 'best' },
  { slug: 'leather-boots-winter', name: { fa: 'بوت چرمی زمستانی مردانه', ps: 'د ژمي چرمي بوټان', en: 'Winter leather boots' }, categoryKey: 'footwear', price: 3750, rating: 4.3, reviewCount: 221, salesCount: 890, shop: { fa: 'کفش کابل', ps: 'د کابل بوټان', en: 'Kabul Footwear' }, brand: { fa: 'چرم‌دوز', ps: 'چرم دوز', en: 'Charmduz' }, region: { fa: 'کابل', ps: 'کابل', en: 'Kabul' } },
  { slug: 'pressure-cooker-6l', name: { fa: 'دیگ زودپز استیل ۶ لیتری', ps: 'ژر پخوونکی لوښی ۶ لیټره', en: 'Steel pressure cooker 6L' }, categoryKey: 'homeAppliances', price: 2100, comparePrice: 2700, rating: 4.4, reviewCount: 318, salesCount: 1120, shop: { fa: 'لوازم خانه', ps: 'د کور وسایل', en: 'Home Essentials' }, brand: { fa: 'استیل‌پرو', ps: 'سټیل پرو', en: 'SteelPro' }, region: { fa: 'کابل', ps: 'کابل', en: 'Kabul' }, badge: 'sale' },
  { slug: 'rosewater-kabul-250', name: { fa: 'گلاب طبیعی کابل — ۲۵۰ میلی‌لیتر', ps: 'د کابل طبیعي ګلاب — ۲۵۰ml', en: 'Natural Kabul rosewater — 250ml' }, categoryKey: 'beauty', price: 480, rating: 4.6, reviewCount: 265, salesCount: 1560, shop: { fa: 'عطر و گلاب', ps: 'عطر او ګلاب', en: 'Attar & Rose' }, brand: { fa: 'گل سرخ', ps: 'سره ګل', en: 'Golsorkh' }, region: { fa: 'کابل', ps: 'کابل', en: 'Kabul' } },
  { slug: 'yoga-mat-pro', name: { fa: 'تشک یوگا ضدلغزش حرفه‌ای', ps: 'د یوګا دوشک', en: 'Non-slip yoga mat Pro' }, categoryKey: 'sports', price: 1250, comparePrice: 1650, rating: 4.2, reviewCount: 134, salesCount: 540, shop: { fa: 'ورزش کابل', ps: 'د کابل سپورت', en: 'Kabul Sports' }, brand: { fa: 'فیت‌لاین', ps: 'فټ لاین', en: 'Fitline' }, region: { fa: 'کابل', ps: 'کابل', en: 'Kabul' }, badge: 'sale' },
  { slug: 'kids-winter-jacket', name: { fa: 'جاکت زمستانی کودکانه ضدآب', ps: 'د ماشومانو ژمنی جاکټ', en: 'Kids waterproof winter jacket' }, categoryKey: 'baby', price: 1890, comparePrice: 2400, rating: 4.5, reviewCount: 187, salesCount: 760, shop: { fa: 'دنیای کودک', ps: 'د ماشوم نړۍ', en: 'Kids World' }, brand: { fa: 'وارم‌کیدز', ps: 'وارم کیډز', en: 'WarmKids' }, region: { fa: 'کابل', ps: 'کابل', en: 'Kabul' }, badge: 'new' },
  { slug: 'dari-poetry-collection', name: { fa: 'مجموعه اشعار کلاسیک دری', ps: 'د دري کلاسیک شعرونو ټولګه', en: 'Classic Dari poetry collection' }, categoryKey: 'books', price: 650, rating: 4.9, reviewCount: 412, salesCount: 1980, shop: { fa: 'کتاب‌فروشی پامیر', ps: 'د پامیر کتاب پلورنځی', en: 'Pamir Books' }, brand: { fa: 'نشر پامیر', ps: 'پامیر خپرندویه', en: 'Pamir Press' }, region: { fa: 'کابل', ps: 'کابل', en: 'Kabul' }, badge: 'best' },
  { slug: 'led-desk-lamp', name: { fa: 'چراغ مطالعه LED قابل تنظیم', ps: 'د مطالعې LED څراغ', en: 'Adjustable LED desk lamp' }, categoryKey: 'electronics', price: 980, comparePrice: 1300, rating: 4.3, reviewCount: 156, salesCount: 670, shop: { fa: 'الکترونیک هرات', ps: 'د هرات بریښنایي', en: 'Herat Electronics' }, brand: { fa: 'لایت‌مکس', ps: 'لایټ مکس', en: 'Lightmax' }, region: { fa: 'هرات', ps: 'هرات', en: 'Herat' }, badge: 'sale' },
  { slug: 'natural-honey-1kg', name: { fa: 'عسل طبیعی کوهی — ۱ کیلوگرم', ps: 'طبیعي غرنی شات — ۱ کیلو', en: 'Natural mountain honey — 1kg' }, categoryKey: 'homeAppliances', price: 1680, comparePrice: 2050, rating: 4.7, reviewCount: 298, salesCount: 1340, shop: { fa: 'عسل پنجشیر', ps: 'د پنجشیر شات', en: 'Panjshir Honey' }, brand: { fa: 'کوهسار', ps: 'کوهسار', en: 'Kohsar' }, region: { fa: 'پنجشیر', ps: 'پنجشیر', en: 'Panjshir' }, badge: 'best' },
  { slug: 'embroidered-scarf', name: { fa: 'شال سوزن‌دوزی دست‌دوز', ps: 'لاسي ګنډل شوې شال', en: 'Hand-embroidered scarf' }, categoryKey: 'clothing', price: 1350, rating: 4.6, reviewCount: 167, salesCount: 580, shop: { fa: 'صنایع دستی', ps: 'لاسي صنایع', en: 'Handicrafts' }, brand: { fa: 'سوزن‌دوزی', ps: 'ګنډنه', en: 'Suzanduzi' }, region: { fa: 'قندهار', ps: 'کندهار', en: 'Kandahar' }, inStock: false },
];

function build(seed: Seed, locale: Locale, index: number): ProductSummary {
  return {
    id: `showcase-${seed.slug}`,
    slug: seed.slug,
    name: seed.name[locale],
    shortDescription: '',
    categoryKey: seed.categoryKey,
    price: seed.price,
    comparePrice: seed.comparePrice ?? null,
    currency: 'AFN',
    badge: seed.badge,
    region: seed.region[locale],
    // Deliberately image-less: the shape system renders a deterministic
    // graphic per product, which is what we want to preview.
    images: [],
    inStock: seed.inStock !== false,
    sellerId: `showcase-seller-${index % 6}`,
    sellerShopName: seed.shop[locale],
    brandName: seed.brand[locale],
    brandSlug: seed.brand.en.toLowerCase().replace(/\s+/g, '-'),
    averageRating: seed.rating,
    reviewCount: seed.reviewCount,
    salesCount: seed.salesCount,
    viewCount: seed.salesCount * 7,
  };
}

function rotate<T>(items: T[], by: number): T[] {
  const offset = by % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

export function showcaseProducts(locale: Locale, section: 'featured' | 'bestSelling' | 'newest' | 'popular', size = 8): ProductSummary[] {
  if (!isShowcaseMode()) return [];
  const all = SEEDS.map((seed, index) => build(seed, locale, index));
  const ordered =
    section === 'bestSelling'
      ? [...all].sort((a, b) => (b.salesCount ?? 0) - (a.salesCount ?? 0))
      : section === 'newest'
        ? rotate(all, 3)
        : section === 'popular'
          ? [...all].sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
          : rotate(all, 6);
  return ordered.slice(0, size);
}

export type ShowcaseStore = { id: string; shopName: string; productCount: number; rating: number; city: string };

const STORE_SEEDS: Array<{ id: string; name: Record<Locale, string>; city: Record<Locale, string>; productCount: number; rating: number }> = [
  { id: 'showcase-seller-0', name: { fa: 'زعفران هرات', ps: 'د هرات زعفران', en: 'Herat Saffron' }, city: { fa: 'هرات', ps: 'هرات', en: 'Herat' }, productCount: 128, rating: 4.8 },
  { id: 'showcase-seller-1', name: { fa: 'دیجیتال کابل', ps: 'ډیجیټل کابل', en: 'Kabul Digital' }, city: { fa: 'کابل', ps: 'کابل', en: 'Kabul' }, productCount: 342, rating: 4.5 },
  { id: 'showcase-seller-2', name: { fa: 'قالین‌بافی اندخوی', ps: 'د اندخوی قالین', en: 'Andkhoy Carpets' }, city: { fa: 'فاریاب', ps: 'فاریاب', en: 'Faryab' }, productCount: 76, rating: 4.9 },
  { id: 'showcase-seller-3', name: { fa: 'پوشاک وطنی', ps: 'وطني جامې', en: 'Vatan Clothing' }, city: { fa: 'مزار شریف', ps: 'مزار شریف', en: 'Mazar-i-Sharif' }, productCount: 214, rating: 4.6 },
  { id: 'showcase-seller-4', name: { fa: 'خشکبار کابل', ps: 'د کابل وچې مېوې', en: 'Kabul Nuts' }, city: { fa: 'کابل', ps: 'کابل', en: 'Kabul' }, productCount: 95, rating: 4.7 },
  { id: 'showcase-seller-5', name: { fa: 'لوازم خانه', ps: 'د کور وسایل', en: 'Home Essentials' }, city: { fa: 'کابل', ps: 'کابل', en: 'Kabul' }, productCount: 187, rating: 4.3 },
  { id: 'showcase-seller-6', name: { fa: 'کتاب‌فروشی پامیر', ps: 'د پامیر کتاب پلورنځی', en: 'Pamir Books' }, city: { fa: 'کابل', ps: 'کابل', en: 'Kabul' }, productCount: 63, rating: 4.9 },
  { id: 'showcase-seller-7', name: { fa: 'عسل پنجشیر', ps: 'د پنجشیر شات', en: 'Panjshir Honey' }, city: { fa: 'پنجشیر', ps: 'پنجشیر', en: 'Panjshir' }, productCount: 41, rating: 4.7 },
];

export function showcaseStores(locale: Locale, size = 8): ShowcaseStore[] {
  if (!isShowcaseMode()) return [];
  return STORE_SEEDS.slice(0, size).map((store) => ({
    id: store.id,
    shopName: store.name[locale],
    productCount: store.productCount,
    rating: store.rating,
    city: store.city[locale],
  }));
}

export type ShowcaseBrand = { id: string; name: string; slug: string; productCount: number };

const BRAND_SEEDS: Array<{ slug: string; name: Record<Locale, string>; productCount: number }> = [
  { slug: 'red-gold', name: { fa: 'طلای سرخ', ps: 'سره سره', en: 'Red Gold' }, productCount: 48 },
  { slug: 'techline', name: { fa: 'تک‌لاین', ps: 'ټیک لاین', en: 'Techline' }, productCount: 132 },
  { slug: 'naqsh-kohan', name: { fa: 'نقش کهن', ps: 'زوړ نقش', en: 'Naqsh Kohan' }, productCount: 27 },
  { slug: 'abrisham', name: { fa: 'ابریشم', ps: 'وریښم', en: 'Abrisham' }, productCount: 64 },
  { slug: 'soundex', name: { fa: 'ساندکس', ps: 'ساندکس', en: 'Soundex' }, productCount: 89 },
  { slug: 'kohsar', name: { fa: 'کوهسار', ps: 'کوهسار', en: 'Kohsar' }, productCount: 35 },
  { slug: 'steelpro', name: { fa: 'استیل‌پرو', ps: 'سټیل پرو', en: 'SteelPro' }, productCount: 71 },
  { slug: 'lajward', name: { fa: 'لاجورد', ps: 'لاجورد', en: 'Lajward' }, productCount: 42 },
  { slug: 'golsorkh', name: { fa: 'گل سرخ', ps: 'سره ګل', en: 'Golsorkh' }, productCount: 56 },
  { slug: 'fitline', name: { fa: 'فیت‌لاین', ps: 'فټ لاین', en: 'Fitline' }, productCount: 38 },
];

export function showcaseBrands(locale: Locale, size = 10): ShowcaseBrand[] {
  if (!isShowcaseMode()) return [];
  return BRAND_SEEDS.slice(0, size).map((brand) => ({
    id: brand.slug,
    slug: brand.slug,
    name: brand.name[locale],
    productCount: brand.productCount,
  }));
}

export type ShowcaseCategory = { id: string; key: string; name: string; slug: string; productCount: number };

const CATEGORY_SEEDS: Array<{ key: CategoryKey; name: Record<Locale, string>; productCount: number }> = [
  { key: 'clothing', name: { fa: 'پوشاک', ps: 'جامې', en: 'Clothing' }, productCount: 1240 },
  { key: 'digital', name: { fa: 'دیجیتال', ps: 'ډیجیټل', en: 'Digital' }, productCount: 860 },
  { key: 'homeAppliances', name: { fa: 'لوازم خانگی', ps: 'د کور وسایل', en: 'Home appliances' }, productCount: 730 },
  { key: 'beauty', name: { fa: 'آرایشی و بهداشتی', ps: 'ښکلا او روغتیا', en: 'Beauty' }, productCount: 615 },
  { key: 'sports', name: { fa: 'ورزشی', ps: 'ورزش', en: 'Sports' }, productCount: 420 },
  { key: 'footwear', name: { fa: 'کفش و کتانی', ps: 'بوټان', en: 'Footwear' }, productCount: 508 },
  { key: 'baby', name: { fa: 'کودک و نوزاد', ps: 'ماشومان', en: 'Baby & kids' }, productCount: 390 },
  { key: 'books', name: { fa: 'کتاب و لوازم', ps: 'کتابونه', en: 'Books' }, productCount: 275 },
  { key: 'electronics', name: { fa: 'الکترونیک', ps: 'بریښنایي', en: 'Electronics' }, productCount: 690 },
  { key: 'watches', name: { fa: 'ساعت و اکسسوری', ps: 'ساعتونه', en: 'Watches' }, productCount: 310 },
];

export function showcaseCategories(locale: Locale, size = 10): ShowcaseCategory[] {
  if (!isShowcaseMode()) return [];
  return CATEGORY_SEEDS.slice(0, size).map((category) => ({
    id: category.key,
    key: category.key,
    slug: category.key,
    name: category.name[locale],
    productCount: category.productCount,
  }));
}
