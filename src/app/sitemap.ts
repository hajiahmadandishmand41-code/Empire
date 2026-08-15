import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

/**
 * sitemap.xml — Stage 5 SEO.
 *
 * Emits one URL per public route per locale.
 * Includes all publicly accessible pages for maximum search engine coverage:
 *   - Static public pages (home, shop, blog, auth, legal, etc.)
 *   - Dynamic products (fetched from DB at build time)
 *   - Dynamic categories (fetched from DB at build time)
 *   - All configured locales
 *
 * Dynamic entries gracefully degrade: if the database is unavailable
 * during build, static-only entries are returned.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
  const now = new Date();

  /** Static public routes — path fragment after locale prefix */
  const publicRoutes: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    priority: number;
  }> = [
    { path: '',                   changeFrequency: 'daily',   priority: 1.0 },
    { path: '/shop',              changeFrequency: 'daily',   priority: 0.9 },
    { path: '/search',            changeFrequency: 'daily',   priority: 0.8 },
    { path: '/traditional',       changeFrequency: 'weekly',  priority: 0.7 },
    { path: '/about',             changeFrequency: 'monthly', priority: 0.6 },
    { path: '/contact',           changeFrequency: 'monthly', priority: 0.6 },
    { path: '/faq',               changeFrequency: 'monthly', priority: 0.6 },
    { path: '/terms',             changeFrequency: 'monthly', priority: 0.5 },
    { path: '/returns',           changeFrequency: 'monthly', priority: 0.5 },
    { path: '/warranty',          changeFrequency: 'monthly', priority: 0.5 },
    { path: '/blog',              changeFrequency: 'weekly',  priority: 0.7 },
    { path: '/auth/login',        changeFrequency: 'yearly',  priority: 0.4 },
    { path: '/auth/register',     changeFrequency: 'yearly',  priority: 0.4 },
  ];

  const entries: MetadataRoute.Sitemap = [];

  // Static pages — one entry per locale
  for (const locale of routing.locales) {
    for (const route of publicRoutes) {
      entries.push({
        url: `${base}/${locale}${route.path}`,
        lastModified: now,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [l, `${base}/${l}${route.path}`]),
          ),
        },
      });
    }
  }

  // Dynamic entries — products, categories, stores
  try {
    const { prisma, isDatabaseConfigured } = await import('@/lib/db');
    if (isDatabaseConfigured()) {
      const [products, categories] = await Promise.all([
        prisma.product.findMany({
          where: { isActive: true },
          select: { slug: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
          take: 5000,
        }),
        prisma.category.findMany({
          select: { slug: true },
          orderBy: { name: 'asc' },
        }),
      ]);

      // Products
      for (const product of products) {
        const path = `/shop/${product.slug}`;
        entries.push({
          url: `${base}/${routing.defaultLocale}${path}`,
          lastModified: product.updatedAt,
          changeFrequency: 'weekly',
          priority: 0.8,
          alternates: {
            languages: Object.fromEntries(
              routing.locales.map((l) => [l, `${base}/${l}${path}`]),
            ),
          },
        });
      }

      // Categories
      for (const category of categories) {
        const path = `/shop?category=${category.slug}`;
        entries.push({
          url: `${base}/${routing.defaultLocale}${path}`,
          lastModified: now,
          changeFrequency: 'weekly',
          priority: 0.7,
          alternates: {
            languages: Object.fromEntries(
              routing.locales.map((l) => [l, `${base}/${l}${path}`]),
            ),
          },
        });
      }

      // Seller stores
      const sellers = await prisma.user.findMany({
        where: {
          sellerStatus: 'approved' as never,
          isActive: true as never,
        } as never,
        select: { id: true, updatedAt: true },
        take: 1000,
      });
      for (const seller of sellers) {
        const path = `/store/${seller.id}`;
        entries.push({
          url: `${base}/${routing.defaultLocale}${path}`,
          lastModified: seller.updatedAt,
          changeFrequency: 'weekly',
          priority: 0.6,
          alternates: {
            languages: Object.fromEntries(
              routing.locales.map((l) => [l, `${base}/${l}${path}`]),
            ),
          },
        });
      }
    }
  } catch {
    // Database unavailable during build — static entries only.
  }

  return entries;
}
