'use client';

import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronRight, ChevronLeft, ShoppingBag, Percent, Store,
  ArrowLeft, Sparkles, TrendingUp, Users, Package,
  Smartphone, Shirt, Home, Leaf, Play,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/providers/theme-provider';

interface Slide {
  id: number;
  eyebrow: string;
  badge: string;
  title: string;
  highlight: string;
  subtitle: string;
  cta: string;
  ctaHref: string;
  secondaryCta: string;
  secondaryHref: string;
  /** Dark mode gradient classes */
  bg: string;
  /** Light mode gradient classes — richer brand-consistent gradients */
  lightBg: string;
  accentBg: string;
  accentText: string;
  statsTextColor: string;
  icon: React.ComponentType<{ className?: string }>;
  pattern: string;
  lightPattern: string;
  accentColor: string;
}

const slides: Slide[] = [
  {
    id: 1,
    eyebrow: 'Empire Shop',
    badge: 'بزرگ‌ترین فروشگاه آنلاین افغانستان',
    title: 'هزاران محصول',
    highlight: 'اصل و معتبر',
    subtitle: 'پوشاک، دیجیتال، خانگی، آرایشی و ورزشی — با ضمانت اصالت و ارسال سریع به سراسر افغانستان',
    cta: 'مشاهده فروشگاه',
    ctaHref: '/shop',
    secondaryCta: 'ثبت‌نام رایگان',
    secondaryHref: '/auth/register',
    bg: 'from-rose-600 via-rose-700 to-[#5a0a28]',
    lightBg: 'from-[#DC1649] via-[#c01040] to-[#7a0828]',
    accentBg: 'bg-white/15',
    accentText: 'text-rose-100',
    statsTextColor: 'text-rose-200',
    icon: ShoppingBag,
    pattern: 'radial-gradient(ellipse at 80% 10%, rgba(255,255,255,0.12) 0%, transparent 55%), radial-gradient(ellipse at 10% 90%, rgba(0,0,0,0.2) 0%, transparent 50%)',
    lightPattern: 'radial-gradient(ellipse at 80% 10%, rgba(255,200,200,0.18) 0%, transparent 55%), radial-gradient(ellipse at 10% 90%, rgba(80,0,20,0.3) 0%, transparent 50%)',
    accentColor: '#DC1649',
  },
  {
    id: 2,
    eyebrow: 'جشنواره ویژه',
    badge: 'تخفیف‌های استثنایی',
    title: 'تا ۵۰٪',
    highlight: 'تخفیف فوری',
    subtitle: 'بیش از ۲۰۰ محصول منتخب با قیمت‌های باورنکردنی — فرصت محدود را از دست ندهید',
    cta: 'مشاهده تخفیف‌ها',
    ctaHref: '/shop?badge=sale',
    secondaryCta: 'همه محصولات',
    secondaryHref: '/shop',
    bg: 'from-violet-600 via-purple-700 to-[#2d1458]',
    lightBg: 'from-[#6d28d9] via-[#5b21b6] to-[#2e1065]',
    accentBg: 'bg-purple-300/20',
    accentText: 'text-purple-100',
    statsTextColor: 'text-purple-200',
    icon: Percent,
    pattern: 'radial-gradient(ellipse at 15% 80%, rgba(167,139,250,0.2) 0%, transparent 55%), radial-gradient(ellipse at 85% 15%, rgba(255,255,255,0.08) 0%, transparent 50%)',
    lightPattern: 'radial-gradient(ellipse at 15% 80%, rgba(167,139,250,0.25) 0%, transparent 55%), radial-gradient(ellipse at 85% 15%, rgba(220,22,73,0.12) 0%, transparent 50%)',
    accentColor: '#7C4DFF',
  },
  {
    id: 3,
    eyebrow: 'فرصت طلایی',
    badge: 'بدون هزینه راه‌اندازی',
    title: 'فروشنده',
    highlight: 'موفق شوید',
    subtitle: 'به جمع هزاران فروشنده موفق بپیوندید و محصولاتتان را با بهترین شرایط به سراسر افغانستان بفروشید',
    cta: 'شروع رایگان',
    ctaHref: '/seller',
    secondaryCta: 'اطلاعات بیشتر',
    secondaryHref: '/about',
    bg: 'from-slate-700 via-gray-800 to-[#0f172a]',
    lightBg: 'from-[#1e3a5f] via-[#1e2d4f] to-[#0f172a]',
    accentBg: 'bg-amber-400/20',
    accentText: 'text-amber-100',
    statsTextColor: 'text-amber-200',
    icon: Store,
    pattern: 'radial-gradient(ellipse at 50% 50%, rgba(251,191,36,0.12) 0%, transparent 65%), radial-gradient(ellipse at 90% 10%, rgba(255,255,255,0.06) 0%, transparent 45%)',
    lightPattern: 'radial-gradient(ellipse at 50% 50%, rgba(251,191,36,0.15) 0%, transparent 65%), radial-gradient(ellipse at 90% 10%, rgba(220,22,73,0.1) 0%, transparent 45%)',
    accentColor: '#F59E0B',
  },
];

const INTERVAL_MS = 5500;

const quickLinks = [
  { label: 'موبایل و تبلت', href: '/shop?categoryKey=digital',       color: 'from-blue-500 to-blue-600',    Icon: Smartphone },
  { label: 'پوشاک و مد',   href: '/shop?categoryKey=clothing',       color: 'from-rose-500 to-rose-600',    Icon: Shirt      },
  { label: 'لوازم خانگی',  href: '/shop?categoryKey=homeAppliances', color: 'from-amber-500 to-orange-500', Icon: Home       },
  { label: 'سنتی افغانی',  href: '/traditional',                     color: 'from-emerald-500 to-teal-600', Icon: Leaf       },
];

const stats = [
  { icon: Package,    value: '+۱۰,۰۰۰', label: 'محصول',   color: 'text-rose-300'   },
  { icon: Users,      value: '+۵۰,۰۰۰', label: 'مشتری',   color: 'text-blue-300'   },
  { icon: Store,      value: '+۵۰۰',     label: 'فروشنده', color: 'text-emerald-300' },
  { icon: TrendingUp, value: '٪۱۰۰',    label: 'اصالت',   color: 'text-amber-300'  },
];

export function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  // FIX: Track progress bar width properly with state to reset on slide change
  const [progressWidth, setProgressWidth] = useState(0);
  const progressAnimRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';

  const goTo = useCallback((index: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrent((index + slides.length) % slides.length);
      setIsTransitioning(false);
    }, 200);
  }, []);

  const next = useCallback(() => goTo((current + 1) % slides.length), [current, goTo]);
  const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, goTo]);

  // Auto-advance timer
  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(next, INTERVAL_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, paused, next]);

  // FIX: Reset and animate progress bar whenever slide changes or paused state changes
  useEffect(() => {
    // Cancel any pending animation frame
    if (progressAnimRef.current !== null) {
      cancelAnimationFrame(progressAnimRef.current);
    }

    if (paused) {
      // Keep progress where it is when paused — just don't animate
      return;
    }

    // Reset to 0 immediately
    setProgressWidth(0);

    // Use double-rAF to ensure the DOM has settled at 0% before we start the transition
    progressAnimRef.current = requestAnimationFrame(() => {
      progressAnimRef.current = requestAnimationFrame(() => {
        setProgressWidth(100);
      });
    });

    return () => {
      if (progressAnimRef.current !== null) {
        cancelAnimationFrame(progressAnimRef.current);
      }
    };
  }, [current, paused]);

  const slide = slides[current];
  const SlideIcon = slide.icon;
  const activeBg = isDark ? slide.bg : slide.lightBg;
  const activePattern = isDark ? slide.pattern : slide.lightPattern;

  return (
    <section aria-label="بنر اصلی" className="w-full bg-gray-100 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-screen-xl px-3 sm:px-6 py-3 sm:py-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">

          {/* ── Main slider (3/4) ── */}
          <div
            className="relative overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5 lg:col-span-3"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* Slide */}
            <div
              className={cn(
                'relative bg-gradient-to-br min-h-[220px] sm:min-h-[270px] transition-opacity duration-300',
                activeBg,
                isTransitioning ? 'opacity-0' : 'opacity-100',
              )}
            >
              {/* Pattern overlay — separate from gradient so both are visible */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{ backgroundImage: activePattern }}
                aria-hidden
              />
              {/* Decorative shapes */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-12 -end-12 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
                <div className="absolute bottom-0 start-0 h-40 w-40 rounded-full bg-black/15 blur-2xl" />
                <div className="absolute top-1/2 end-1/4 h-32 w-32 rounded-full bg-white/4 blur-2xl -translate-y-1/2" />
              </div>

              <div className="relative flex items-center justify-between px-6 py-8 sm:px-10 sm:py-10">
                {/* ── Text content ── */}
                <div className={cn(
                  'flex-1 max-w-md space-y-3.5 transition-all duration-300',
                  isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0',
                )}>
                  {/* Eyebrow */}
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">
                    {slide.eyebrow}
                  </p>

                  {/* Badge */}
                  <span className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-white shadow-sm',
                    slide.accentBg,
                    'border border-white/20 backdrop-blur-sm',
                  )}>
                    <Sparkles className="h-3 w-3 text-yellow-300" aria-hidden />
                    {slide.badge}
                  </span>

                  {/* Title */}
                  <h2 className="text-2xl font-extrabold text-white sm:text-3xl md:text-4xl leading-tight tracking-tight">
                    {slide.title}{' '}
                    <span className="text-yellow-300 drop-shadow-sm">{slide.highlight}</span>
                  </h2>

                  <p className={cn('text-xs leading-relaxed max-w-sm opacity-85', slide.accentText)}>
                    {slide.subtitle}
                  </p>

                  {/* CTAs */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <Link
                      href={slide.ctaHref}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-extrabold text-gray-900 shadow-lg transition-all hover:bg-gray-50 hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
                    >
                      {slide.cta}
                      <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
                    </Link>
                    <Link
                      href={slide.secondaryHref}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/15 hover:-translate-y-0.5"
                    >
                      <Play className="h-3 w-3" aria-hidden />
                      {slide.secondaryCta}
                    </Link>
                  </div>
                </div>

                {/* ── Icon ── */}
                <div className="hidden sm:flex relative ms-8 flex-shrink-0">
                  <div className="relative">
                    {/* Glow ring */}
                    <div
                      className="absolute inset-0 rounded-3xl animate-pulse-ring opacity-30"
                      style={{ background: `radial-gradient(circle, ${slide.accentColor}80, transparent)` }}
                    />
                    <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-3xl bg-white/14 ring-1 ring-white/25 backdrop-blur-md shadow-2xl animate-float">
                      <SlideIcon className="h-16 w-16 text-white/90 drop-shadow-lg" aria-hidden />
                    </div>
                    <Sparkles className="absolute -top-3 -end-3 h-6 w-6 text-yellow-300/90 animate-pulse" aria-hidden />
                  </div>
                </div>
              </div>

              {/* ── Stats bar ── */}
              <div className="flex items-center justify-between border-t border-white/10 bg-black/20 backdrop-blur-sm px-6 py-2.5 sm:px-10">
                {stats.map(({ icon: Icon, value, label, color }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <Icon className={cn('h-3.5 w-3.5 shrink-0', color)} aria-hidden />
                    <span className="text-[11px] font-black text-white">{value}</span>
                    <span className="hidden text-[10px] text-white/60 sm:inline">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Progress bar — FIX: use state-driven width with CSS transition ── */}
            <div className="absolute bottom-[38px] sm:bottom-[41px] inset-x-0 h-0.5 bg-white/15">
              <div
                className="h-full bg-white/60 rounded-full"
                style={{
                  width: `${progressWidth}%`,
                  transition: progressWidth > 0 ? `width ${INTERVAL_MS}ms linear` : 'none',
                }}
              />
            </div>

            {/* ── Navigation arrows ── */}
            <button
              onClick={prev}
              aria-label="اسلاید قبلی"
              className="absolute start-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition-all hover:scale-110 active:scale-95 border border-white/15 shadow-lg"
            >
              <ChevronRight className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" aria-hidden />
            </button>
            <button
              onClick={next}
              aria-label="اسلاید بعدی"
              className="absolute end-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition-all hover:scale-110 active:scale-95 border border-white/15 shadow-lg"
            >
              <ChevronLeft className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" aria-hidden />
            </button>

            {/* ── Slide dots ── */}
            <div className="absolute bottom-[46px] sm:bottom-[50px] inset-x-0 flex justify-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`اسلاید ${i + 1}`}
                  className={cn(
                    'rounded-full transition-all duration-300',
                    i === current
                      ? 'w-7 h-2 bg-white'
                      : 'w-2 h-2 bg-white/35 hover:bg-white/60',
                  )}
                />
              ))}
            </div>
          </div>

          {/* ── Quick links (1/4) ── */}
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-1">
            {quickLinks.map(({ label, href, color, Icon }) => (
              <Link
                key={label}
                href={href}
                className="group flex items-center justify-between gap-2 rounded-xl bg-white dark:bg-gray-800/80 px-3.5 py-3.5 shadow-sm border border-gray-200 dark:border-gray-700/50 hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <span className="text-xs font-bold text-gray-800 dark:text-gray-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors leading-tight">
                  {label}
                </span>
                <div className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm transition-transform group-hover:scale-110',
                  color,
                )}>
                  <Icon className="h-4.5 w-4.5" aria-hidden />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
