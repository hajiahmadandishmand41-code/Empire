import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const title = locale === 'en' ? `Category: ${slug} | Eshop` : locale === 'ps' ? `کټګوري: ${slug} | Eshop` : `دسته‌بندی: ${slug} | Eshop`;
  return { title, robots: { index: true, follow: true } };
}

/**
 * Compatibility category route.
 * Existing catalog filtering is already implemented in /shop; this stable URL
 * keeps `/category/[slug]` available without duplicating the catalog engine.
 */
export default async function CategoryPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  redirect(`/${locale}/shop?categoryKey=${encodeURIComponent(slug)}`);
}
