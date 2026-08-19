import { setRequestLocale } from 'next-intl/server';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { Container } from '@/components/layout/container';
import { requireAuth } from '@/lib/auth/roles';
import { ProfileView } from '@/features/profile';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireAuth({ locale });

  return (
    <>
      <SiteHeader />
      <main id="main" className="min-h-dvh bg-background pb-20 md:pb-8">
        <Container size="lg" className="py-6 sm:py-10">
          <ProfileView user={user} locale={locale} />
        </Container>
      </main>
      <SiteFooter />
      <BottomNavigation />
    </>
  );
}
