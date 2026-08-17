import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { ProductDetail } from '@/features/product/components/product-detail';
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
  return <><SiteHeader /><main id="main" className="min-h-dvh bg-background"><ProductDetail product={product} related={related} locale={locale} currency="AFN" /></main><SiteFooter /></>;
}
