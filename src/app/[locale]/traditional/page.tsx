import type { Metadata } from 'next';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { TraditionalPageContent } from '@/features/traditional/components/traditional-page-content';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');
type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const title = locale === 'en' ? 'Afghan Local Products | Eshop' : locale === 'ps' ? 'د افغانستان کورني محصولات | Eshop' : 'محصولات وطنی افغانستان | Eshop';
  const description = locale === 'en' ? 'Discover local Afghan products from trusted sellers.' : locale === 'ps' ? 'د باوري پلورونکو څخه د افغانستان کورني محصولات ومومئ.' : 'محصولات وطنی افغانستان را از فروشندگان معتبر کشف کنید.';
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/traditional`,
      languages: { fa: `${SITE_URL}/fa/traditional`, ps: `${SITE_URL}/ps/traditional`, en: `${SITE_URL}/en/traditional` },
    },
  };
}

export default async function TraditionalPage({ params }: Props) {
  const { locale } = await params;
  return (
    <>
      <SiteHeader />
      <main id="main" className="traditional-page min-h-dvh bg-background pb-16 md:pb-0">
        <TraditionalPageContent locale={locale} />
      </main>
      <SiteFooter />
      <BottomNavigation />
    </>
  );
}
