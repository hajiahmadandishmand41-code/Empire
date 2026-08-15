import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/layout/container';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { CheckoutView } from '@/features/checkout';
import { Lock } from 'lucide-react';

interface CheckoutPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'checkout' });
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
  const title = `${t('metaTitle')} | Empire Shop`;
  const description = t('metaDescription');
  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/${locale}/checkout` },
    openGraph: { title, description, type: 'website', url: `${siteUrl}/${locale}/checkout` },
    twitter: { card: 'summary', title, description },
    robots: { index: false, follow: true },
  };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('checkout');

  return (
    <>
      <SiteHeader />
      <main id="main" className="min-h-dvh bg-background py-6 sm:py-8">
        <Container size="xl">
          <header className="mb-6">
            <div className="flex items-center gap-2.5">
              {/* Stage 5: replaced bg-blue-50 text-blue-500 → semantic tokens */}
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"
                aria-hidden="true"
              >
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">
                  {t('title')}
                </h1>
                <p className="text-xs text-muted-foreground">پرداخت امن و رمزگذاری‌شده</p>
              </div>
            </div>
          </header>
          <CheckoutView locale={locale} />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
