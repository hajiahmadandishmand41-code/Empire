import { setRequestLocale } from 'next-intl/server';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { EshopClub } from '@/features/community/components/eshop-club';

type Locale = 'fa' | 'ps' | 'en';

export default async function EshopClubPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = (['fa', 'ps', 'en'].includes(rawLocale) ? rawLocale : 'fa') as Locale;
  setRequestLocale(locale);

  return (
    <>
      <SiteHeader />
      <main id="main"><EshopClub locale={locale} /></main>
      <SiteFooter />
      <BottomNavigation />
    </>
  );
}
