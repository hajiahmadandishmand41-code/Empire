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
import { useLocale } from 'next-intl';

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
  bg: string;
  lightBg: string;
  accentBg: string;
  accentText: string;
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
    icon: Store,
    pattern: 'radial-gradient(ellipse at 50% 50%, rgba(251,191,36,0.12) 0%, transparent 65%), radial-gradient(ellipse at 90% 10%, rgba(255,255,255,0.06) 0%, transparent 45%)',
    lightPattern: 'radial-gradient(ellipse at 50% 50%, rgba(251,191,36,0.15) 0%, transparent 65%), radial-gradient(ellipse at 90% 10%, rgba(220,22,73,0.1) 0%, transparent 45%)',
    accentColor: '#F59E0B',
  },
];

const INTERVAL_MS = 5500;
const quickLinks = [
  { label: 'موبایل و تبلت', href: '/shop?categoryKey=digital', color: 'from-blue-500 to-blue-600', Icon: Smartphone },
  { label: 'پوشاک و مد', href: '/shop?categoryKey=clothing', color: 'from-rose-500 to-rose-600', Icon: Shirt },
  { label: 'لوازم خانگی', href: '/shop?categoryKey=homeAppliances', color: 'from-amber-500 to-orange-500', Icon: Home },
  { label: 'سنتی افغانی', href: '/traditional', color: 'from-emerald-500 to-teal-600', Icon: Leaf },
];
const stats = [
  { icon: Package, value: '+۱۰,۰۰۰', label: 'محصول', color: 'text-rose-300' },
  { icon: Users, value: '+۵۰,۰۰۰', label: 'مشتری', color: 'text-blue-300' },
  { icon: Store, value: '+۵۰۰', label: 'فروشنده', color: 'text-emerald-300' },
  { icon: TrendingUp, value: '٪۱۰۰', label: 'اصالت', color: 'text-amber-300' },
];

export function HeroSection() {
  const locale = useLocale();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);
  const progressAnimRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const localize = useCallback((path: string) => `/${locale}${path.startsWith('/') ? path : `/${path}`}`, [locale]);
  const goTo = useCallback((index: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrent((index + slides.length) % slides.length);
      setIsTransitioning(false);
    }, 200);
  }, []);
  const next = useCallback(() => goTo((current + 1) % slides.length), [current, goTo]);
  const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, goTo]);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(next, INTERVAL_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, paused, next]);

  useEffect(() => {
    if (progressAnimRef.current !== null) cancelAnimationFrame(progressAnimRef.current);
    if (paused) return;
    setProgressWidth(0);
    progressAnimRef.current = requestAnimationFrame(() => {
      progressAnimRef.current = requestAnimationFrame(() => setProgressWidth(100));
    });
    return () => { if (progressAnimRef.current !== null) cancelAnimationFrame(progressAnimRef.current); };
  }, [current, paused]);

  const slide = slides[current];
  const SlideIcon = slide.icon;
  const activeBg = isDark ? slide.bg : slide.lightBg;
  const activePattern = isDark ? slide.pattern : slide.lightPattern;

  return (
    <section aria-label="بنر اصلی" className="w-full border-b border-border bg-muted/30">
      <div className="mx-auto max-w-screen-xl px-3 py-3 sm:px-6 sm:py-5">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="relative overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5 lg:col-span-3" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
            <div className={cn('relative min-h-[250px] bg-gradient-to-br transition-opacity duration-300 sm:min-h-[300px]', activeBg, isTransitioning ? 'opacity-0' : 'opacity-100')}>
              <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: activePattern }} aria-hidden />
              <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                <div className="absolute -end-12 -top-12 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute bottom-0 start-0 h-40 w-40 rounded-full bg-black/15 blur-2xl" />
                <div className="absolute end-1/4 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-white/5 blur-2xl" />
              </div>

              <div className="relative flex min-h-[250px] items-center justify-between px-5 py-8 sm:min-h-[300px] sm:px-10 sm:py-10">
                <div className={cn('max-w-xl flex-1 space-y-3.5 transition-all duration-300', isTransitioning ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100')}>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/65">{slide.eyebrow}</p>
                  <span className={cn('inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm backdrop-blur-sm', slide.accentBg)}>
                    <Sparkles className="h-3 w-3 text-yellow-300" aria-hidden />{slide.badge}
                  </span>
                  <h2 className="text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl md:text-4xl">
                    {slide.title}{' '}<span className="text-yellow-300 drop-shadow-sm">{slide.highlight}</span>
                  </h2>
                  <p className={cn('max-w-lg text-xs leading-7 opacity-90 sm:text-sm', slide.accentText)}>{slide.subtitle}</p>
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <Link href={localize(slide.ctaHref)} className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-extrabold text-gray-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-xl active:scale-95">
                      {slide.cta}<ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
                    </Link>
                    <Link href={localize(slide.secondaryHref)} className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/15">
                      <Play className="h-3 w-3" aria-hidden />{slide.secondaryCta}
                    </Link>
                  </div>
                </div>

                <div className="relative ms-8 hidden flex-shrink-0 sm:flex">
                  <div className="relative">
                    <div className="absolute inset-0 animate-pulse-ring rounded-3xl opacity-30" style={{ background: `radial-gradient(circle, ${slide.accentColor}80, transparent)` }} />
                    <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-white/15 shadow-2xl ring-1 ring-white/25 backdrop-blur-md animate-float">
                      <SlideIcon className="h-16 w-16 text-white/90 drop-shadow-lg" aria-hidden />
                    </div>
                    <Sparkles className="absolute -end-3 -top-3 h-6 w-6 animate-pulse text-yellow-300/90" aria-hidden />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 bg-black/20 px-5 py-2.5 backdrop-blur-sm sm:px-10">
                {stats.map(({ icon: Icon, value, label, color }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <Icon className={cn('h-3.5 w-3.5 shrink-0', color)} aria-hidden />
                    <span className="text-[11px] font-black text-white">{value}</span>
                    <span className="hidden text-[10px] text-white/60 sm:inline">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-[38px] h-0.5 bg-white/15 sm:bottom-[41px]" aria-hidden>
              <div className="h-full rounded-full bg-white/70" style={{ width: `${progressWidth}%`, transition: progressWidth > 0 ? `width ${INTERVAL_MS}ms linear` : 'none' }} />
            </div>
            <button onClick={prev} aria-label="اسلاید قبلی" className="absolute start-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white shadow-lg backdrop-blur-sm transition hover:scale-110 hover:bg-black/50 active:scale-95">
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
            <button onClick={next} aria-label="اسلاید بعدی" className="absolute end-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white shadow-lg backdrop-blur-sm transition hover:scale-110 hover:bg-black/50 active:scale-95">
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <div className="absolute inset-x-0 bottom-[46px] flex justify-center gap-2 sm:bottom-[50px]">
              {slides.map((_, i) => (
                <button key={i} onClick={() => goTo(i)} aria-label={`اسلاید ${i + 1}`} className={cn('rounded-full transition-all duration-300', i === current ? 'h-2 w-7 bg-white' : 'h-2 w-2 bg-white/35 hover:bg-white/60')} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-1">
            {quickLinks.map(({ label, href, color, Icon }) => (
              <Link key={label} href={localize(href)} className="group flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3.5 py-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-md dark:hover:border-rose-700">
                <span className="text-xs font-bold leading-tight text-foreground transition-colors group-hover:text-rose-600 dark:group-hover:text-rose-400">{label}</span>
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm transition-transform group-hover:scale-110', color)}>
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
