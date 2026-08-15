import { setRequestLocale } from 'next-intl/server';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { SettingsView } from '@/features/settings/components/settings-view';

interface Props {
  params: Promise<{ locale: string }>;
}

export const metadata = {
  title: 'تنظیمات | Empire Shop',
  description: 'تنظیمات حساب، ظاهر، زبان و اعلان‌ها',
};

export default async function SettingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <SiteHeader />
      <main id="main" className="min-h-dvh pb-20 md:pb-8 bg-background">
        <SettingsView locale={locale} />
      </main>
      <SiteFooter />
      <BottomNavigation />
    </>
  );
}
