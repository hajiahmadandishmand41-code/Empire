import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { ProductDetail } from '@/features/product/components/product-detail';
import { RecentlyViewedTracker } from '@/features/product/components/recently-viewed-tracker';
import type { Metadata } from 'next';
import { getProductService } from '@/server/infrastructure/registry';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProductService().getProductBySlug(slug);
  const t = await getTranslations({ locale, namespace: 'product' });
  if (!product) return { title: t('notFound.title'), description: t('notFound.description'), robots: { index: false, follow: false } };

  const title = `${product.name} | Empire Shop`;
  const description = product.shortDescription ?? product.name;
  const ogImage = product.images?.[0]?.src ?? `${SITE_URL}/icons/icon-512.png`;
  const canonicalUrl = `${SITE_URL}/${locale}/shop/${slug}`;
  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: { fa: `${SITE_URL}/fa/shop/${slug}`, ps: `${SITE_URL}/ps/shop/${slug}`, en: `${SITE_URL}/en/shop/${slug}` },
    },
    openGraph: { title, description, type: 'website', url: canonicalUrl, images: [{ url: ogImage, width: 800, height: 800, alt: product.name }], siteName: 'Empire Shop' },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const service = getProductService();
  const product = await service.getProductBySlug(slug);
  if (!product) notFound();
  const related = await service.getRelatedProducts(slug, 4);
  const productUrl = `${SITE_URL}/${locale}/shop/${slug}`;
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription ?? product.name,
    image: product.images.map((image) => image.src).filter(Boolean),
    sku: product.slug,
    brand: { '@type': 'Brand', name: product.sellerShopName ?? 'EmpireShop' },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'AFN',
      price: String(product.price),
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: product.sellerShopName ?? 'EmpireShop' },
    },
    ...(product.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: String(product.averageRating),
            reviewCount: String(product.reviewCount),
          },
        }
      : {}),
  };

  return (
    <>
      <SiteHeader />
      <main id="main" className="min-h-dvh bg-background">
        <RecentlyViewedTracker slug={product.slug} categoryKey={product.categoryKey} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema).replace(/</g, '\\u003c') }} />
        <ProductDetail product={product} related={related} locale={locale} currency="AFN" />
      </main>
      <SiteFooter />
    </>
  );
}
