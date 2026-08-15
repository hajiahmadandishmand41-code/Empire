import { getLocale, getTranslations } from 'next-intl/server';
import { ProductSliderSection } from './product-slider-section';
import type { SliderProduct } from './product-slider-section';

async function getTraditionalProducts(): Promise<SliderProduct[]> {
  try {
    const base =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.PORT ? `http://localhost:${process.env.PORT}` : 'http://localhost:3000');
    // Fetch products from traditional/handicrafts category or general
    const res = await fetch(`${base}/api/products?limit=12`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data?.ok || !Array.isArray(data?.data)) return [];
    return data.data.map((p: Record<string, unknown>) => ({
      id: String(p.id ?? ''),
      name: String(p.name ?? ''),
      slug: String(p.slug ?? ''),
      price: Number(p.price ?? 0),
      comparePrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      images: Array.isArray(p.images)
        ? (p.images as Array<{ src?: string | null; url?: string }>).map((img) => ({
            url: img.url ?? img.src ?? '',
          })).filter((img) => img.url)
        : [],
      badge: 'traditional',
      rating: typeof p.rating === 'number' ? p.rating : undefined,
      reviewCount: typeof p.reviewCount === 'number' ? p.reviewCount : undefined,
      salesCount: typeof p.salesCount === 'number' ? p.salesCount : undefined,
      viewCount: typeof p.viewCount === 'number' ? p.viewCount : undefined,
      category: p.category as { name: string } | undefined,
      sellerWhatsapp: typeof p.sellerWhatsapp === 'string' ? p.sellerWhatsapp : undefined,
    }));
  } catch {
    return [];
  }
}

export async function TraditionalProductsSection() {
  const locale = await getLocale();
  const t = await getTranslations('home.sections').catch(() => null);
  const products = await getTraditionalProducts();

  return (
    <ProductSliderSection
      title={t ? t('traditional.title') : 'محصولات سنتی افغانستان'}
      subtitle={t ? t('traditional.subtitle') : 'صنایع دستی اصیل مستقیم از تولیدکننده'}
      viewAllHref="/shop?q=سنتی"
      accentColor="bg-emerald-600"
      products={products}
      locale={locale}
      currency="AFN"
    />
  );
}
