import type { MetadataRoute } from 'next';

/**
 * robots.txt — Stage 5 SEO.
 * Set `NEXT_PUBLIC_SITE_URL` in production for absolute sitemap link.
 */
export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/seller/',
          '/profile/',
          '/checkout/',
          '/cart/',
          '/403/',
          '/order/success/',
          '/payment/',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
    ],
    ...(base
      ? {
          sitemap: `${base}/sitemap.xml`,
          host: base,
        }
      : {}),
  };
}
