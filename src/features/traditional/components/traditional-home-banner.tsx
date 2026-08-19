'use client';

import { ArrowLeft, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/routing';

export function TraditionalHomeBanner({ locale = 'fa' }: { locale?: string }) {
  const copy = locale === 'en'
    ? { kicker: 'AFGHAN COLLECTION', title: 'Discover Afghanistan’s finest local products', action: 'Explore local products' }
    : locale === 'ps'
      ? { kicker: 'د افغانستان ټولګه', title: 'د افغانستان غوره کورني محصولات ومومئ', action: 'کورني محصولات وګورئ' }
      : { kicker: 'مجموعه افغانستان', title: 'بهترین محصولات وطنی افغانستان را کشف کنید', action: 'مشاهده محصولات وطنی' };

  return (
    <section className="mx-auto max-w-screen-xl px-3 pt-3 sm:px-6 sm:pt-4" aria-label={copy.kicker}>
      <Link
        href="/traditional"
        className="group relative block overflow-hidden rounded-2xl border border-amber-400/20 bg-gradient-to-r from-[#8e3b12] via-[#b65a18] to-[#7b2d12] px-4 py-3 shadow-sm transition-transform duration-200 hover:-translate-y-px sm:px-5"
      >
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute -start-20 top-0 h-full w-24 skew-x-[-18deg] bg-white/20 blur-xl animate-[shimmer_4.5s_linear_infinite]" />
        </div>
        <div className="relative flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-amber-200" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-amber-100/85">{copy.kicker}</p>
            <p className="mt-0.5 truncate text-xs font-extrabold text-white sm:text-sm">{copy.title}</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[10px] font-extrabold text-[#7b2d12] shadow-sm">
            {copy.action}
            <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
          </span>
        </div>
      </Link>
      <style jsx>{`@keyframes shimmer{0%{transform:translateX(-140%)}100%{transform:translateX(620%)}}`}</style>
    </section>
  );
}
