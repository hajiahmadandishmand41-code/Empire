import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Emit a self-contained production server for container/standalone deploys.
  // Vercel builds its own serverless output and must NOT use `standalone`.
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  outputFileTracingRoot: process.cwd(),
  productionBrowserSourceMaps: false,
  serverExternalPackages: ['@prisma/client', 'prisma', 'nodemailer', 'twilio'],
  experimental: {
    // Stage 5: expanded package import optimization list
    optimizePackageImports: [
      'lucide-react',
      'clsx',
      'tailwind-merge',
      'date-fns',
      'zod',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      'recharts',
    ],
    // Stage 5: PPR-safe server actions
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
          ? [process.env.VERCEL_PROJECT_PRODUCTION_URL]
          : []),
        ...(process.env.VERCEL_URL ? [process.env.VERCEL_URL] : []),
      ],
    },
  },
  // nodemailer and twilio are optional production dependencies that are NOT
  // installed in the default dev setup. Mark them as webpack externals so
  // the build does not fail when they are absent. The dynamic-import guards
  // in src/lib/email.ts (isSmtpConfigured) and src/lib/sms.ts
  // (isTwilioConfigured) already prevent calling them at runtime.
  webpack(config, { isServer }) {
    if (isServer) {
      const prev = Array.isArray(config.externals) ? config.externals : [];
      config.externals = [...prev, 'nodemailer', 'twilio'];
    }
    return config;
  },
  // Stage 5 — image optimisation (enhanced).
  // Image remote patterns are restricted to known, trusted domains.
  // Wildcards (`hostname: '**'`) are intentionally avoided to prevent
  // open-redirect and SSRF-style image proxy abuse.
  // Add your CDN / object-storage hostname here when you configure
  // production image hosting (e.g. 'your-bucket.s3.amazonaws.com').
  images: {
    remotePatterns: [
      // Common image CDN / hosting providers used by Afghan e-commerce sellers
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.empireshop.af' },
      { protocol: 'https', hostname: 'assets.empireshop.af' },
      { protocol: 'https', hostname: 'storage.empireshop.af' },
      // Object storage backends
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Google / Firebase Storage
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      // Image optimisation proxies
      { protocol: 'https', hostname: 'imagedelivery.net' },
      // Local development placeholder images
      ...(process.env.NODE_ENV !== 'production' ? [
        { protocol: 'https', hostname: 'placehold.co' },
        { protocol: 'https', hostname: 'picsum.photos' },
      ] : []),
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24,
    dangerouslyAllowSVG: false,
    contentDispositionType: 'inline',
  },
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    return [
      {
        source: '/fonts/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/icons/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source: '/manifest.webmanifest',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
      },
      {
        source: '/:path*',
        headers: [
          ...(isProd ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }] : []),
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
