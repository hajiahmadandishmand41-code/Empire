import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/layout/container';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { CartView } from '@/features/cart';
import { ShoppingCart } from 'lucide-react';

interface CartPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: CartPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'cart' });
  const title = `${t('title')} | Empire Shop`;
  const description = t('metaDescription');
  return {
    title,
    description,
    robots: { index: false, follow: true },
    openGraph: { title, description, type: 'website' },
    twitter: { card: 'summary', title, description },
  };
}

export default async function CartPage({ params }: CartPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('cart');

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
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">
                  {t('title')}
                </h1>
                <p className="text-xs text-muted-foreground sm:text-sm">{t('subtitle')}</p>
              </div>
            </div>
          </header>
          <CartView locale={locale} />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
