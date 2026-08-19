'use client';

import { ArrowLeft, Sparkles, ShoppingBag } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

export function LocalProductsHomeBanner() {
  const t = useTranslations('home.sections.afghan');
  const nav = useTranslations('nav');

  return (
    <section aria-labelledby="local-products-banner-title" className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-12 -end-12 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 start-0 h-32 w-32 rounded-full bg-amber-400/10 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-screen-xl px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 backdrop-blur-sm">
              <span className="text-sm" aria-hidden>🇦🇫</span>
              <span className="text-[11px] font-bold tracking-wide text-white/90">{t('title')}</span>
              <Sparkles className="h-3 w-3 animate-pulse text-amber-300" aria-hidden />
            </div>
            <h2 id="local-products-banner-title" className="text-xl font-extrabold text-white sm:text-2xl">{t('title')}</h2>
            <p className="max-w-2xl text-xs leading-6 text-white/80 sm:text-sm">{t('subtitle')}</p>
          </div>
          <Link
            href="/traditional"
            className="group inline-flex shrink-0 items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-emerald-800 shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-50 active:scale-95 sm:px-5"
          >
            <ShoppingBag className="h-4 w-4 transition-transform group-hover:scale-110" aria-hidden />
            <span>{nav('shop')}</span>
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
