import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Heart } from 'lucide-react';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { WishlistPageView } from '@/features/wishlist/components/wishlist-page-view';
import { Container } from '@/components/layout/container';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';

interface Props { params: Promise<{ locale: string }> }

const COPY = {
  fa: { title: 'علاقه‌مندی‌های من', description: 'محصولات ذخیره‌شده برای خرید آسان‌تر', back: 'بازگشت' },
  ps: { title: 'زما خوښ شوي محصولات', description: 'د اسانه پیرود لپاره ساتل شوي محصولات', back: 'بېرته' },
  en: { title: 'My Wishlist', description: 'Products saved for easier shopping', back: 'Back' },
} as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const copy = COPY[locale as keyof typeof COPY] ?? COPY.fa;
  return { title: `${copy.title} | Eshop`, description: copy.description, robots: { index: false, follow: true } };
}

export default async function WishlistPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const copy = COPY[locale as keyof typeof COPY] ?? COPY.fa;

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main id="main" className="min-h-dvh bg-background pb-20 md:pb-8">
        <Container size="xl" className="py-6 sm:py-8">
          <div className="mb-6 flex items-center gap-4">
            <Link href="/" aria-label={copy.back} className="hidden h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted/60 hover:text-foreground sm:flex">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-md"><Heart className="h-5 w-5 fill-white text-white" aria-hidden /></div>
              <div><h1 className="text-xl font-extrabold text-foreground sm:text-2xl">{copy.title}</h1><p className="mt-0.5 text-xs text-muted-foreground">{copy.description}</p></div>
            </div>
          </div>
          <WishlistPageView locale={locale} />
        </Container>
      </main>
      <SiteFooter />
      <BottomNavigation />
    </div>
  );
}
