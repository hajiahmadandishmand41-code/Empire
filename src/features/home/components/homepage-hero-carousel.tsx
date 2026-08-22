'use client';

import * as React from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type CampaignBanner = {
  id: string;
  title: string | null;
  subtitle: string | null;
  ctaLabel: string | null;
  href: string | null;
  desktopImageUrl: string;
  mobileImageUrl: string | null;
  autoSlide: boolean;
  durationMs: number;
};

function bannerCopy(locale: string) {
  if (locale === 'en') return { aria: 'Featured campaigns', next: 'Next campaign', previous: 'Previous campaign', swipe: 'Swipe to explore', emptyTitle: 'Discover what is worth buying today', emptyText: 'Fresh offers, trusted sellers and practical products in one calm marketplace.', cta: 'Explore the marketplace' };
  if (locale === 'ps') return { aria: 'ځانګړي کمپاینونه', next: 'راتلونکی کمپاین', previous: 'مخکینی کمپاین', swipe: 'د لیدلو لپاره کش کړئ', emptyTitle: 'نن د اخیستلو ارزښتناک شیان ومومئ', emptyText: 'نوي وړاندیزونه، باوري پلورونکي او ګټور محصولات په یوه ساده بازار کې.', cta: 'بازار وګورئ' };
  return { aria: 'کمپین‌های ویژه', next: 'کمپین بعدی', previous: 'کمپین قبلی', swipe: 'برای دیدن بکشید', emptyTitle: 'امروز چه چیزی ارزش خرید دارد؟', emptyText: 'پیشنهادهای تازه، فروشندگان معتبر و محصولات کاربردی در یک بازار سریع و آرام.', cta: 'ورود به فروشگاه' };
}

export function HomepageHeroCarousel({ banners = [], locale = 'fa' }: { banners?: CampaignBanner[]; locale?: string }) {
  const labels = bannerCopy(locale);
  const count = banners.length;
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const [swipeStart, setSwipeStart] = React.useState<number | null>(null);

  React.useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  React.useEffect(() => {
    if (count < 2 || paused || reduceMotion) return;
    const duration = Math.max(3000, banners[index]?.durationMs || 5000);
    if (banners[index]?.autoSlide === false) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % count), duration);
    return () => window.clearInterval(timer);
  }, [banners, count, index, paused, reduceMotion]);

  function move(direction: 1 | -1) {
    if (!count) return;
    setIndex((current) => (current + direction + count) % count);
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) { setSwipeStart(event.clientX); }
  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (swipeStart === null || count < 2) return;
    const delta = event.clientX - swipeStart;
    if (Math.abs(delta) > 45) move(delta < 0 ? 1 : -1);
    setSwipeStart(null);
  }

  if (count === 0) {
    return (
      <section className="mx-auto max-w-screen-xl px-3 pt-3 sm:px-6 sm:pt-5" aria-label={labels.aria}>
        <div className="relative overflow-hidden rounded-[26px] border border-primary/10 bg-gradient-to-br from-card via-card to-primary/[0.04] px-5 py-7 shadow-premium sm:px-10 sm:py-10 lg:min-h-[360px] lg:flex lg:items-center">
          <div className="pointer-events-none absolute -end-16 -top-16 h-40 w-40 rounded-full bg-primary/[0.08] blur-2xl" aria-hidden="true" />
          <div className="relative max-w-2xl" dir={locale === 'en' ? 'ltr' : 'rtl'}>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-accent px-3 py-1.5 text-[10px] font-bold text-accent-foreground"><Sparkles className="h-3.5 w-3.5" />ایشاپ</span>
            <h1 className="mt-3 text-[2rem] font-black leading-[1.08] tracking-tight sm:text-5xl">{labels.emptyTitle}</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">{labels.emptyText}</p>
            <Link href="/shop" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm shadow-primary/15 transition-transform duration-200 hover:-translate-y-0.5">{labels.cta}<ChevronLeft className="h-4 w-4 rtl:rotate-180" /></Link>
          </div>
        </div>
      </section>
    );
  }

  const banner = banners[index] ?? banners[0];

  return (
    <section className="mx-auto max-w-screen-xl px-3 pt-3 sm:px-6 sm:pt-5" aria-label={labels.aria}>
      <div
        className="group relative overflow-hidden rounded-[28px] border border-border bg-card shadow-premium"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <div className="relative aspect-[1.6/1] min-h-[300px] sm:aspect-[2.3/1] sm:min-h-[390px]">
          <picture>
            {banner.mobileImageUrl ? <source media="(max-width: 767px)" srcSet={banner.mobileImageUrl} /> : null}
            <Image src={banner.desktopImageUrl} alt={banner.title || 'ایشاپ'} fill priority={index === 0} sizes="(max-width: 767px) 100vw, 1200px" className="object-cover" />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/0" aria-hidden="true" />
          <div key={banner.id} className={cn('absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:p-10', !reduceMotion && 'hero-copy-in')} dir={locale === 'en' ? 'ltr' : 'rtl'}>
            <div className="max-w-2xl text-white">
              <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-extrabold backdrop-blur-sm"><Sparkles className="h-3 w-3" />ایشاپ</span></div>
              {banner.title ? <h1 className="mt-3 text-2xl font-black leading-tight sm:text-4xl lg:text-5xl">{banner.title}</h1> : null}
              {banner.subtitle ? <p className="mt-2 max-w-xl text-xs leading-6 text-white/85 sm:text-sm sm:leading-7">{banner.subtitle}</p> : null}
              {banner.ctaLabel && banner.href ? <Link href={banner.href as never} className={cn('mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-extrabold text-slate-900 shadow-sm', !reduceMotion && 'transition-transform duration-200 hover:-translate-y-0.5')}>{banner.ctaLabel}<ChevronLeft className="h-4 w-4 rtl:rotate-180" /></Link> : null}
            </div>
          </div>
        </div>

        {count > 1 ? (
          <>
            <button type="button" onClick={() => move(-1)} aria-label={labels.previous} className="absolute start-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-black/40"><ChevronRight className="h-4 w-4 rtl:rotate-180" /></button>
            <button type="button" onClick={() => move(1)} aria-label={labels.next} className="absolute end-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-black/40"><ChevronLeft className="h-4 w-4 rtl:rotate-180" /></button>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 sm:bottom-4" aria-label="Slide progress">
              {banners.map((item, dot) => <button key={item.id} type="button" onClick={() => setIndex(dot)} aria-label={`${dot + 1}`} aria-current={index === dot} className={cn('h-1.5 rounded-full transition-all', index === dot ? 'w-8 bg-white' : 'w-1.5 bg-white/40')} />)}
            </div>
          </>
        ) : null}
        <p className="absolute bottom-3 start-4 text-[10px] text-white/70 sm:hidden">{labels.swipe}</p>
      </div>
    </section>
  );
}
