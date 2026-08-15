'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';

const categories = [
  { name: 'قالین', emoji: '🎨' },
  { name: 'زعفران', emoji: '🌸' },
  { name: 'میوه خشک', emoji: '🍇' },
  { name: 'صنایع دستی', emoji: '🏺' },
  { name: 'لباس محلی', emoji: '👘' },
  { name: 'عسل', emoji: '🍯' },
  { name: 'خشکبار', emoji: '🥜' },
  { name: 'سنگ‌های قیمتی', emoji: '💎' },
];

export function TraditionalProductsBanner() {
  return (
    <section
      aria-labelledby="traditional-banner-title"
      className="relative overflow-hidden border-b border-border"
    >
      {/* Rich emerald-to-amber gradient background with Afghan pattern feel */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-teal-800 to-emerald-900" />
      {/* Decorative layered shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-16 -end-16 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 start-0 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="absolute top-1/2 start-1/3 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl" />
        {/* Geometric pattern overlay */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.04]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="afghan-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <polygon points="30,5 55,20 55,40 30,55 5,40 5,20" fill="none" stroke="white" strokeWidth="1.5" />
              <circle cx="30" cy="30" r="8" fill="none" stroke="white" strokeWidth="1" />
              <line x1="30" y1="5" x2="30" y2="55" stroke="white" strokeWidth="0.5" />
              <line x1="5" y1="30" x2="55" y2="30" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#afghan-pattern)" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-screen-xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Text content */}
          <div className="flex-1 space-y-3">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-3.5 py-1.5 backdrop-blur-sm">
              <span className="text-base" aria-hidden>🇦🇫</span>
              <span className="text-[11px] font-bold text-white/95 tracking-wide">محصولات اصیل افغانستان</span>
              <Sparkles className="h-3 w-3 text-amber-300" aria-hidden />
            </div>

            {/* Title */}
            <h2
              id="traditional-banner-title"
              className="text-2xl font-extrabold leading-tight text-white sm:text-3xl"
            >
              محصولات سنتی افغانستان
            </h2>
            <p className="text-sm leading-relaxed text-emerald-100/85 max-w-md">
              قالین‌های دستباف، زعفران هرات، صنایع دستی اصیل و محصولات طبیعی — مستقیم از تولیدکننده به دست شما
            </p>

            {/* Category chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              {categories.map((cat) => (
                <span
                  key={cat.name}
                  className="inline-flex items-center gap-1 rounded-full bg-white/14 border border-white/20 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium text-white/90 hover:bg-white/22 transition-colors cursor-default"
                >
                  <span aria-hidden>{cat.emoji}</span>
                  {cat.name}
                </span>
              ))}
            </div>
          </div>

          {/* CTA column */}
          <div className="flex flex-col items-start gap-3 sm:items-end sm:shrink-0">
            {/* Trust badge */}
            <div className="flex items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-400/10 px-3.5 py-2.5">
              <span className="text-2xl" aria-hidden>🏔️</span>
              <div>
                <p className="text-[11px] font-bold text-amber-200">ضمانت اصالت کالا</p>
                <p className="text-[10px] text-amber-300/70 mt-0.5">حمایت از تولید داخلی</p>
              </div>
            </div>

            {/* Main CTA button */}
            <Link
              href="/traditional"
              className="group inline-flex items-center gap-2.5 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-emerald-800 shadow-lg shadow-black/20 transition-all hover:bg-emerald-50 hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
            >
              مشاهده همه محصولات
              <ArrowLeft className="h-4 w-4 rtl:rotate-180 transition-transform group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5" aria-hidden />
            </Link>

            <Link
              href="/shop?categoryKey=traditional"
              className="text-[11px] text-emerald-300 hover:text-white transition-colors"
            >
              جستجو در فروشگاه ←
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
