'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, ShoppingBag } from 'lucide-react';

const categories = [
  { name: 'زعفران', emoji: '🌸' },
  { name: 'قالین', emoji: '🎨' },
  { name: 'میوه خشک', emoji: '🍇' },
  { name: 'صنایع دستی', emoji: '🏺' },
  { name: 'لباس محلی', emoji: '👘' },
  { name: 'عسل', emoji: '🍯' },
  { name: 'خشکبار', emoji: '🥜' },
  { name: 'سنگ‌های قیمتی', emoji: '💎' },
];

export function LocalProductsHomeBanner() {
  return (
    <section
      aria-labelledby="local-products-banner-title"
      className="relative overflow-hidden border-b border-border"
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800" />

      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-12 -end-12 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 start-0 h-32 w-32 rounded-full bg-amber-400/10 blur-3xl" />
        {/* Afghan-inspired SVG pattern */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="lp-afghan-pat" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
              <polygon points="24,4 44,16 44,32 24,44 4,32 4,16" fill="none" stroke="white" strokeWidth="1.2" />
              <circle cx="24" cy="24" r="6" fill="none" stroke="white" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lp-afghan-pat)" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-screen-xl px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          {/* Left: title + tags */}
          <div className="flex-1 space-y-2.5">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 backdrop-blur-sm">
              <span className="text-sm" aria-hidden>🇦🇫</span>
              <span className="text-[11px] font-bold text-white/90 tracking-wide">محصولات اصیل افغانستان</span>
              <Sparkles className="h-3 w-3 text-amber-300 animate-pulse" aria-hidden />
            </div>

            {/* Title */}
            <h2
              id="local-products-banner-title"
              className="text-xl font-extrabold text-white sm:text-2xl"
            >
              خرید محصولات محلی
            </h2>

            {/* Category chips — scrollable on mobile */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <span
                  key={cat.name}
                  className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white/90 backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                  <span aria-hidden className="text-xs">{cat.emoji}</span>
                  {cat.name}
                </span>
              ))}
            </div>
          </div>

          {/* Right: CTA */}
          <div className="flex shrink-0 flex-col items-start gap-2.5 sm:items-end">
            {/* Trust badge */}
            <div className="flex items-center gap-2 rounded-xl border border-amber-300/25 bg-amber-400/10 px-3 py-2">
              <span className="text-lg" aria-hidden>🏔️</span>
              <div>
                <p className="text-[11px] font-bold text-amber-200">ضمانت اصالت کالا</p>
                <p className="text-[10px] text-amber-300/70">مستقیم از تولیدکننده</p>
              </div>
            </div>

            {/* CTA button with animated pulse */}
            <Link
              href="/traditional"
              className="group inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-sm font-bold text-emerald-800 shadow-lg shadow-black/20 transition-all hover:bg-emerald-50 hover:-translate-y-0.5 hover:shadow-xl active:scale-95 animate-pulse-scale"
            >
              <ShoppingBag className="h-4 w-4 transition-transform group-hover:scale-110" aria-hidden />
              مشاهده همه محصولات محلی
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180 transition-transform group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
