import { ImageUploadGuard } from '@/components/providers/image-upload-guard';

/**
 * Root layout — required by Next.js App Router.
 * The locale layout owns the document because it sets locale-aware lang/dir.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <><ImageUploadGuard />{children}</>;
}

export const metadata = {
  title: 'Eshop',
  description: 'Eshop — modern Afghan marketplace for shopping from verified sellers.',
  applicationName: 'Eshop',
  generator: 'Eshop',
  metadataBase: (() => {
    const raw = process.env.NEXT_PUBLIC_SITE_URL;
    const trimmed = typeof raw === 'string' ? raw.trim() : '';
    const base = trimmed || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    return new URL(base);
  })(),
};
