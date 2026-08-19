/**
 * Root layout — required by Next.js App Router.
 * The localized layout owns the document and locale direction.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}

export const metadata = {
  title: 'Eshop — ایشاپ',
  description: 'Eshop — فروشگاه آنلاین افغانستان',
  metadataBase: (() => {
    const raw = process.env.NEXT_PUBLIC_SITE_URL;
    const trimmed = typeof raw === 'string' ? raw.trim() : '';
    const base = trimmed || (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000');
    return new URL(base);
  })(),
};
