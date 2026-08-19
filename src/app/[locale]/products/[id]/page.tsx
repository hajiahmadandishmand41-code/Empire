import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { ProductDetail } from '@/features/product/components/product-detail';
import { RecentlyViewedTracker } from '@/features/product/components/recently-viewed-tracker';
import { getProductService } from '@/server/infrastructure/registry';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const product = await getProductService().getProductById(id);
  const t = await getTranslations({ locale, namespace: 'product' });
  if (!product) return { title: t('notFound.title'), description: t('notFound.description'), robots: { index: false, follow: false } };
  const title = `${product.name} | Eshop`;
  const description = product.shortDescription ?? product.name;
  const canonicalUrl = `${SITE_URL}/${locale}/products/${id}`;
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl, languages: { fa: `${SITE_URL}/fa/products/${id}`, ps: `${SITE_URL}/ps/products/${id}`, en: `${SITE_URL}/en/products/${id}` } },
    openGraph: { title, description, type: 'website', url: canonicalUrl, images: product.images?.[0]?.src ? [{ url: product.images[0].src, alt: product.name }] : undefined, siteName: 'Eshop' },
    twitter: { card: 'summary_large_image', title, description, images: product.images?.[0]?.src ? [product.images[0].src] : undefined },
  };
}

export default async function ProductByIdPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const service = getProductService();
  const product = await service.getProductById(id);
  if (!product) notFound();
  const related = await service.getRelatedProducts(product.slug, 4);
  const productUrl = `${SITE_URL}/${locale}/products/${id}`;
  const reviewCount = product.reviewCount ?? 0;
  const averageRating = product.averageRating ?? 0;
  const schema = { '@context': 'https://schema.org', '@type': 'Product', name: product.name, description: product.shortDescription ?? product.name, image: product.images.map((image) => image.src).filter(Boolean), sku: id, offers: { '@type': 'Offer', url: productUrl, priceCurrency: 'AFN', price: String(product.price), availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', seller: { '@type': 'Organization', name: product.sellerShopName ?? 'Eshop' } }, ...(reviewCount > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: String(averageRating), reviewCount: String(reviewCount) } } : {}) };
  return <><SiteHeader /><main id="main" className="min-h-dvh bg-background"><RecentlyViewedTracker slug={product.slug} categoryKey={product.categoryKey} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} /><ProductDetail product={product} related={related} locale={locale} currency="AFN" /></main><SiteFooter /></>;
}
