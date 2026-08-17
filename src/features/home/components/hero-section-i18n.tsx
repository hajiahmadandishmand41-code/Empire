'use client';

import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Home, Leaf, Percent, Shirt, ShoppingBag, Smartphone, Sparkles, Store } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/providers/theme-provider';

interface Slide { eyebrow: string; badge: string; title: string; highlight: string; subtitle: string; primaryCta: string; primaryHref: string; secondaryCta: string; secondaryHref: string; darkBg: string; lightBg: string; icon: React.ComponentType<{ className?: string }>; accent: string; }
const INTERVAL_MS = 5600;

export function HeroSectionI18n() {
  const locale = useLocale();
  const t = useTranslations('home');
  const tc = useTranslations('common');
  const tn = useTranslations('nav');
  const { resolvedTheme } = useTheme();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localize = useCallback((path: string) => `/${locale}${path.startsWith('/') ? path : `/${path}`}`, [locale]);

  const slides = useMemo<Slide[]>(() => [
    { eyebrow: t('hero.eyebrow'), badge: t('header.tagline'), title: t('hero.title'), highlight: t('hero.scrollHint'), subtitle: t('hero.subtitle'), primaryCta: t('hero.primaryCta'), primaryHref: '/shop', secondaryCta: t('hero.secondaryCta'), secondaryHref: '/about', darkBg: 'from-rose-700 via-rose-800 to-slate-950', lightBg: 'from-[#dc1649] via-[#bd164a] to-[#68112f]', icon: ShoppingBag, accent: '#f59e0b' },
    { eyebrow: t('featured.sectionTitle'), badge: t('featured.badgeBest'), title: t('featured.sectionTitle'), highlight: t('featured.badgeNew'), subtitle: t('featured.sectionSubtitle'), primaryCta: t('featured.viewAll'), primaryHref: '/shop', secondaryCta: tn('categories'), secondaryHref: '/shop?view=categories', darkBg: 'from-violet-800 via-purple-800 to-slate-950', lightBg: 'from-[#6d28d9] via-[#5b21b6] to-[#2e1065]', icon: Percent, accent: '#a78bfa' },
    { eyebrow: t('trust.sectionTitle'), badge: t('trust.extra.payment.title'), title: t('trust.items.shipping.title'), highlight: t('trust.items.quality.title'), subtitle: t('trust.items.shipping.description'), primaryCta: tn('shop'), primaryHref: '/shop', secondaryCta: tn('contact'), secondaryHref: '/contact', darkBg: 'from-slate-800 via-slate-900 to-slate-950', lightBg: 'from-[#1e3a5f] via-[#1e2d4f] to-[#0f172a]', icon: Store, accent: '#f59e0b' },
  ], [t, tn]);

  const quickLinks = useMemo(() => [
    { label: t('categories.items.digital.title'), href: '/shop?categoryKey=digital', color: 'from-blue-500 to-blue-600', Icon: Smartphone },
    { label: t('categories.items.clothing.title'), href: '/shop?categoryKey=clothing', color: 'from-rose-500 to-rose-600', Icon: Shirt },
    { label: t('categories.items.homeAppliances.title'), href: '/shop?categoryKey=homeAppliances', color: 'from-amber-500 to-orange-500', Icon: Home },
    { label: t('categories.items.electronics.title'), href: '/shop?categoryKey=electronics', color: 'from-emerald-500 to-teal-600', Icon: Leaf },
  ], [t]);

  const next = useCallback(() => setCurrent((index) => (index + 1) % slides.length), [slides.length]);
  const previous = useCallback(() => setCurrent((index) => (index - 1 + slides.length) % slides.length), [slides.length]);
  useEffect(() => { if (paused) return; timerRef.current = setTimeout(next, INTERVAL_MS); return () => { if (timerRef.current) clearTimeout(timerRef.current); }; }, [current, next, paused]);
  useEffect(() => { if (paused) return; const started = performance.now(); let frame = 0; const tick = (now: number) => { setProgress(Math.min(100, ((now - started) / INTERVAL_MS) * 100)); if (now - started < INTERVAL_MS) frame = requestAnimationFrame(tick); }; setProgress(0); frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame); }, [current, paused]);

  const slide = slides[current];
  const Icon = slide.icon;
  const background = resolvedTheme === 'dark' ? slide.darkBg : slide.lightBg;
  return <section aria-label={tc('appName')} className="w-full border-b border-border bg-muted/30"><div className="mx-auto max-w-screen-xl px-3 py-3 sm:px-6 sm:py-5"><div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
    <div className="relative overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5 lg:col-span-3" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <div className={cn('relative min-h-[270px] bg-gradient-to-br transition-colors duration-500 sm:min-h-[330px]', background)}><div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle at 82% 18%, ${slide.accent}45 0%, transparent 36%), radial-gradient(circle at 8% 88%, rgba(255,255,255,.12) 0%, transparent 36%)` }} aria-hidden />
        <div className="relative flex min-h-[270px] items-center justify-between px-5 py-8 sm:min-h-[330px] sm:px-10 sm:py-10"><div className="max-w-2xl flex-1 space-y-4"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">{slide.eyebrow}</p><div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm"><Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden />{slide.badge}</div><h1 className="max-w-xl text-2xl font-black leading-[1.35] tracking-tight text-white sm:text-4xl md:text-5xl">{slide.title}{' '}<span className="text-amber-300">{slide.highlight}</span></h1><p className="max-w-xl text-xs leading-7 text-white/85 sm:text-sm">{slide.subtitle}</p><div className="flex flex-wrap gap-2.5 pt-1"><Link href={localize(slide.primaryHref)} className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg transition hover:-translate-y-0.5">{slide.primaryCta}<ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden /></Link><Link href={localize(slide.secondaryHref)} className="inline-flex items-center rounded-xl border border-white/25 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/10">{slide.secondaryCta}</Link></div></div><div className="relative ms-8 hidden shrink-0 sm:block" aria-hidden><div className="relative flex h-36 w-36 items-center justify-center rounded-[2rem] border border-white/20 bg-white/10 shadow-2xl backdrop-blur-md md:h-44 md:w-44"><Icon className="h-16 w-16 text-white/90 md:h-20 md:w-20" /></div></div></div>
        <div className="flex items-center justify-between border-t border-white/10 bg-black/20 px-5 py-2.5 sm:px-10"><span className="text-[10px] font-semibold text-white/75">{tc('tagline')}</span><span className="text-[10px] font-semibold text-white/60">{locale.toUpperCase()}</span></div></div>
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/15"><div className="h-full bg-white/80" style={{ width: `${progress}%` }} /></div>
      <button type="button" onClick={previous} aria-label={tc('previous')} className="absolute start-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white"><ChevronRight className="h-4 w-4" aria-hidden /></button><button type="button" onClick={next} aria-label={tc('next')} className="absolute end-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white"><ChevronLeft className="h-4 w-4" aria-hidden /></button>
      <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2" role="tablist" aria-label={tc('next')}>{slides.map((_, index) => <button key={index} type="button" onClick={() => setCurrent(index)} role="tab" aria-selected={index === current} aria-label={`${index + 1}`} className={cn('rounded-full', index === current ? 'h-2 w-7 bg-white' : 'h-2 w-2 bg-white/35')} />)}</div>
    </div>
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-1">{quickLinks.map(({ label, href, color, Icon: QuickIcon }) => <Link key={href} href={localize(href)} className="group flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3.5 py-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40"><span className="text-xs font-bold leading-tight text-foreground group-hover:text-primary">{label}</span><span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm', color)}><QuickIcon className="h-[18px] w-[18px]" aria-hidden /></span></Link>)}</div>
  </div></div></section>;
}
