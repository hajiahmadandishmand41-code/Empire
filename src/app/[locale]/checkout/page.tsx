import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from '@/i18n/routing';
import { getCurrentUser } from '@/lib/auth/current-user';
import { Container } from '@/components/layout/container';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { CheckoutViewSafe } from '@/features/checkout/components/checkout-view-safe';
import { Lock, MapPin, CreditCard, CheckCircle2 } from 'lucide-react';

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

  // Checkout is authenticated-only. Keep the intended destination so a guest
  // returns directly to checkout after a successful login/register flow.
  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: '/auth/login?redirect=%2Fcheckout', locale });
  }

  const t = await getTranslations('checkout');
  const isEnglish = locale === 'en';
  const isPashto = locale === 'ps';
  const copy = isEnglish
    ? { secure: 'Secure, encrypted checkout', delivery: 'Delivery', payment: 'Payment', review: 'Review order' }
    : isPashto
      ? { secure: 'خوندي او کوډ شوی چیک اوټ', delivery: 'سپارنه', payment: 'تادیه', review: 'د سپارښتنې کتنه' }
      : { secure: 'پرداخت امن و رمزگذاری‌شده', delivery: 'تحویل', payment: 'پرداخت', review: 'بررسی سفارش' };

  return (
    <>
      <SiteHeader />
      <main id="main" className="min-h-dvh bg-background py-6 sm:py-8">
        <Container size="xl">
          <header className="mb-6 overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary" aria-hidden="true">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">{t('title')}</h1>
                  <p className="mt-1 text-xs text-muted-foreground">{copy.secure}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:min-w-[430px]">
                {[{ icon: MapPin, label: copy.delivery, active: true }, { icon: CreditCard, label: copy.payment, active: false }, { icon: CheckCircle2, label: copy.review, active: false }].map(({ icon: Icon, label, active }, index) => (
                  <div key={label} className="relative flex min-w-0 items-center gap-2 rounded-2xl border border-border bg-background px-2.5 py-2.5 sm:px-3">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{index + 1}</span>
                    <Icon className={`hidden h-3.5 w-3.5 shrink-0 sm:block ${active ? 'text-primary' : 'text-muted-foreground'}`} aria-hidden />
                    <span className={`truncate text-[10px] font-bold sm:text-xs ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </header>
          <CheckoutViewSafe locale={locale} />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
