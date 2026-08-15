import { setRequestLocale } from 'next-intl/server';
import { Heart } from 'lucide-react';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { WishlistPageView } from '@/features/wishlist/components/wishlist-page-view';
import { Container } from '@/components/layout/container';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface Props {
  params: Promise<{ locale: string }>;
}

export const metadata = {
  title: 'علاقه‌مندی‌ها | Empire Shop',
  description: 'محصولات مورد علاقه شما در امپایر شاپ',
};

export default async function WishlistPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <SiteHeader />
      <main id="main" className="min-h-dvh pb-20 md:pb-8 bg-background">
        <Container size="xl" className="py-6 sm:py-8">
          {/* Page header */}
          <div className="mb-6 flex items-center gap-4">
            <Link
              href="/"
              aria-label="بازگشت"
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shadow-sm"
            >
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-md">
                <Heart className="h-5 w-5 text-white fill-white" aria-hidden />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-foreground sm:text-2xl">علاقه‌مندی‌های من</h1>
                <p className="text-xs text-muted-foreground mt-0.5">محصولات ذخیره‌شده برای خرید آسان‌تر</p>
              </div>
            </div>
          </div>

          {/* Wishlist content — client component */}
          <WishlistPageView locale={locale} />
        </Container>
      </main>
      <SiteFooter />
      <BottomNavigation />
    </>
  );
}
