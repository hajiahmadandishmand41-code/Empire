import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import SearchPageContent from './search-page-content';

export const dynamic = 'force-dynamic';

export default async function SearchPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-dvh bg-background">
      <Suspense fallback={
        <>
          <SiteHeader />
          <main id="main" className="pb-20 md:pb-0">
            <div className="mx-auto max-w-screen-xl px-3 py-5 sm:px-6 sm:py-8">
              <div className="mb-4 h-14 animate-pulse rounded-3xl bg-muted" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="overflow-hidden rounded-2xl border border-border bg-card">
                    <div className="aspect-[4/3] animate-pulse bg-muted" />
                    <div className="space-y-2 p-3"><div className="h-3 w-2/3 animate-pulse rounded bg-muted" /><div className="h-4 w-full animate-pulse rounded bg-muted" /><div className="h-4 w-1/2 animate-pulse rounded bg-muted" /></div>
                  </div>
                ))}
              </div>
            </div>
          </main>
          <SiteFooter />
          <BottomNavigation />
        </>
      }>
        <SearchPageContent />
      </Suspense>
    </div>
  );
}
