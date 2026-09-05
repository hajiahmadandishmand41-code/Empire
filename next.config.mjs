import createNextIntlPlugin from 'next-intl/plugin';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Next.js 16 blocks cross-origin loads of dev resources (/_next/*) by
  // default. Local loopback aliases must be allowlisted, otherwise every
  // client chunk is rejected with 403 when the app is opened via
  // http://127.0.0.1:3000 (or [::1]) instead of http://localhost:3000 and the
  // whole UI fails to hydrate. Add ALLOWED_DEV_ORIGINS (comma separated) for
  // LAN/tunnel hosts used during development.
  allowedDevOrigins: [
    '127.0.0.1',
    '[::1]',
    ...(process.env.ALLOWED_DEV_ORIGINS
      ? process.env.ALLOWED_DEV_ORIGINS.split(',')
          .map((host) => host.trim())
          .filter(Boolean)
      : []),
  ],
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  outputFileTracingRoot: process.cwd(),
  productionBrowserSourceMaps: false,
  serverExternalPackages: ['@prisma/client', 'prisma', 'nodemailer', 'twilio'],
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'clsx',
      'tailwind-merge',
      'date-fns',
      'zod',
      'motion',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      'recharts',
    ],
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
  webpack(config, { isServer }) {
    if (isServer) {
      const prev = Array.isArray(config.externals) ? config.externals : [];
      config.externals = [...prev, 'nodemailer', 'twilio'];
    }
    return config;
  },
  images: {
    // Vercel is currently failing requests to its generated `/_next/image`
    // handler for this app. Media is already served through trusted CDN/API
    // URLs, so bypass the failing optimizer rather than returning 500s.
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.empireshop.af' },
      { protocol: 'https', hostname: 'assets.empireshop.af' },
      { protocol: 'https', hostname: 'storage.empireshop.af' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'imagedelivery.net' },
      ...(process.env.NODE_ENV !== 'production'
        ? [
            { protocol: 'https', hostname: 'placehold.co' },
            { protocol: 'https', hostname: 'picsum.photos' },
          ]
        : []),
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
          ...(isProd
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
            : []),
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
