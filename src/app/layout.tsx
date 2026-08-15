/**
 * Root layout — required by Next.js App Router.
 *
 * In a next-intl setup this file must NOT render `<html>` itself: the
 * `[locale]/layout.tsx` is the one that owns the document because it needs
 * locale-aware attributes (lang + dir).
 *
 * Returning children untouched here is the recommended pattern.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}

export const metadata = {
  title: 'Empire Shop',
  description: 'Empire Shop foundation',
  // Make metadataBase robust against undefined, null, empty or whitespace values.
  // Prefer NEXT_PUBLIC_SITE_URL when set and non-empty; otherwise use VERCEL_URL (build-time on Vercel)
  // to produce a production-compatible origin, and finally fall back to localhost for local dev.
  metadataBase: (() => {
    const raw = process.env.NEXT_PUBLIC_SITE_URL;
    const trimmed = typeof raw === 'string' ? raw.trim() : '';
    const base = trimmed || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    return new URL(base);
  })(),
};
