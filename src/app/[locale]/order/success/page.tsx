import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/layout/container';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { OrderSuccessView } from '@/features/checkout/components/order-success-view';

interface OrderSuccessPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: OrderSuccessPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'orderSuccess' });
  const title = `${t('metaTitle')} — Empire Shop`;
  const description = t('metaDescription');
  return {
    title,
    description,
    alternates: { canonical: `/${locale}/order/success` },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/${locale}/order/success`,
    },
    twitter: { card: 'summary', title, description },
    robots: { index: false, follow: false },
  };
}

export default async function OrderSuccessPage({ params }: OrderSuccessPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <SiteHeader />
      <main id="main" className="min-h-dvh bg-cream/50 py-12 sm:py-16 lg:py-20">
        <Container size="md">
          <OrderSuccessView locale={locale} />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
