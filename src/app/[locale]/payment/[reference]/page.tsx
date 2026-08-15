import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/layout/container';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { PaymentStatusView } from '@/features/checkout/components/payment-status-view';

interface PaymentPageProps {
  params: Promise<{ locale: string; reference: string }>;
}

export async function generateMetadata({ params }: PaymentPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'payment' });
  const title = `${t('metaTitle')} — Empire Shop`;
  return {
    title,
    description: t('metaDescription'),
    robots: { index: false, follow: false },
  };
}

/**
 * /payment/[reference] — post-checkout payment status screen.
 * Polls /api/payments/verify?reference=... until a terminal state
 * (paid / failed / cancelled) is reached.
 */
export default async function PaymentPage({ params }: PaymentPageProps) {
  const { locale, reference } = await params;
  setRequestLocale(locale);

  return (
    <>
      <SiteHeader />
      <main id="main" className="min-h-dvh bg-cream/50 py-12 sm:py-16 lg:py-20">
        <Container size="md">
          <PaymentStatusView locale={locale} reference={reference} />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
