'use client';

import * as React from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Home, Compass, Sparkles, Store, Tags, type LucideIcon } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';

type CampaignBanner = { id: string; title: string | null; subtitle: string | null; ctaLabel: string | null; href: string | null; desktopImageUrl: string; mobileImageUrl: string | null; autoSlide: boolean; durationMs: number };
type VisualSlide = { id: string; kind: 'visual'; title: string; subtitle: string; ctaLabel: string; href: string; theme: string; icon: LucideIcon };
type ImageSlide = CampaignBanner & { kind: 'image' };
type Slide = ImageSlide | VisualSlide;

function bannerCopy(locale: string) {
  if (locale === 'en') return { aria: 'Featured campaigns', next: 'Next campaign', previous: 'Previous campaign', swipe: 'Swipe to explore' };
  if (locale === 'ps') return { aria: 'ځانګړي کمپاینونه', next: 'راتلونکی کمپاین', previous: 'مخکینی کمپاین', swipe: 'د لیدلو لپاره کش کړئ' };
  return { aria: 'کمپین‌های ویژه', next: 'کمپین بعدی', previous: 'کمپین قبلی', swipe: 'برای دیدن بکشید' };
}

function fallbackSlides(locale: string): VisualSlide[] {
  const fa: VisualSlide[] = [
    { id: 'local', kind: 'visual', title: 'محصولات وطنی', subtitle: 'حمایت از تولید ملی با انتخاب‌های باکیفیت و اصیل.', ctaLabel: 'مشاهده محصولات', href: '/traditional', theme: 'from-[#fff7f7] via-[#fffdf7] to-[#eaf3fc] dark:from-rose-950/80 dark:via-slate-950 dark:to-sky-950/80', icon: Sparkles },
    { id: 'home', kind: 'visual', title: 'محصولات خانه و زندگی', subtitle: 'برای خانه‌ای زیباتر و خریدی کاربردی‌تر، انتخاب‌های تازه را ببینید.', ctaLabel: 'خرید برای خانه', href: '/categories', theme: 'from-[#fff3f7] via-[#fffdf9] to-[#eaf4ef] dark:from-pink-950/70 dark:via-slate-950 dark:to-emerald-950/70', icon: Home },
    { id: 'stores', kind: 'visual', title: 'فروشگاه‌های ایشاپ', subtitle: 'فروشگاه‌های معتبر و فروشندگان را یکجا کشف کنید.', ctaLabel: 'مشاهده فروشگاه‌ها', href: '/stores', theme: 'from-[#fff6fa] via-[#f4f2fc] to-[#e9f4fb] dark:from-fuchsia-950/70 dark:via-slate-950 dark:to-blue-950/70', icon: Store },
    { id: 'discounts', kind: 'visual', title: 'تخفیف‌های ویژه', subtitle: 'فقط پیشنهادهایی با تخفیف واقعی بیشتر از ۲۰٪ در این بخش.', ctaLabel: 'مشاهده تخفیف‌ها', href: '/discounts', theme: 'from-[#fff5f4] via-[#f0f8fb] to-[#eaf1fb] dark:from-rose-950/70 dark:via-slate-950 dark:to-blue-950/70', icon: Tags },
    { id: 'discover', kind: 'visual', title: 'کشف بهترین‌ها', subtitle: 'پیشنهادهای هوشمند بر اساس محبوبیت، تازگی و سلیقه شما.', ctaLabel: 'شروع کشف', href: '/discover', theme: 'from-[#edf6fc] via-[#fff7fa] to-[#f7effd] dark:from-sky-950/70 dark:via-slate-950 dark:to-fuchsia-950/70', icon: Compass },
  ];
  if (locale === 'en') return fa.map((item) => ({ ...item, title: item.id === 'local' ? 'Afghan products' : item.id === 'home' ? 'Home & lifestyle' : item.id === 'stores' ? 'Eshop stores' : item.id === 'discounts' ? '20%+ discounts' : 'Discover the best', subtitle: item.id === 'local' ? 'Support local production with authentic, quality choices.' : item.id === 'home' ? 'Fresh practical picks for a more beautiful everyday life.' : item.id === 'stores' ? 'Discover trusted stores and sellers in one place.' : item.id === 'discounts' ? 'Only real discounts above 20% are shown here.' : 'Smart picks ranked by popularity, freshness and your taste.', ctaLabel: item.id === 'local' ? 'View products' : item.id === 'home' ? 'Shop for home' : item.id === 'stores' ? 'View stores' : item.id === 'discounts' ? 'View discounts' : 'Start discovering' }));
  if (locale === 'ps') return fa.map((item) => ({ ...item, title: item.id === 'local' ? 'افغاني محصولات' : item.id === 'home' ? 'د کور او ژوند محصولات' : item.id === 'stores' ? 'د ایشاپ پلورنځي' : item.id === 'discounts' ? '۲۰٪+ تخفیفونه' : 'غوره توکي ومومئ', ctaLabel: item.id === 'local' ? 'محصولات وګورئ' : item.id === 'home' ? 'د کور لپاره واخلئ' : item.id === 'stores' ? 'پلورنځي وګورئ' : item.id === 'discounts' ? 'تخفیفونه وګورئ' : 'کشف پیل کړئ' }));
  return fa;
}

export function HomepageHeroCarousel({ banners = [], locale = 'fa' }: { banners?: CampaignBanner[]; locale?: string }) {
  const labels = bannerCopy(locale);
  const visualFallbacks = fallbackSlides(locale);
  const imageSlides: ImageSlide[] = banners.map((banner) => ({ ...banner, kind: 'image' }));
  const slides: Slide[] = [...imageSlides];
  for (const fallback of visualFallbacks) { if (slides.length >= 5) break; slides.push(fallback); }
  const count = slides.length;
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const [swipeStart, setSwipeStart] = React.useState<number | null>(null);

  React.useEffect(() => { const media = window.matchMedia('(prefers-reduced-motion: reduce)'); const update = () => setReduceMotion(media.matches); update(); media.addEventListener?.('change', update); return () => media.removeEventListener?.('change', update); }, []);
  React.useEffect(() => { if (count < 2 || paused || reduceMotion) return; const active = slides[index]; const duration = active.kind === 'image' ? Math.max(3500, active.durationMs || 5000) : 5000; if (active.kind === 'image' && active.autoSlide === false) return; const timer = window.setInterval(() => setIndex((current) => (current + 1) % count), duration); return () => window.clearInterval(timer); }, [count, index, paused, reduceMotion, slides]);

  const move = (direction: 1 | -1) => { if (count >= 2) setIndex((current) => (current + direction + count) % count); };
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => setSwipeStart(event.clientX);
  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => { if (swipeStart === null || count < 2) return; const delta = event.clientX - swipeStart; if (Math.abs(delta) > 45) move(delta < 0 ? 1 : -1); setSwipeStart(null); };
  const slide = slides[index] ?? visualFallbacks[0];
  const SlideIcon = slide.kind === 'visual' ? slide.icon : Sparkles;
  const isEnglish = locale === 'en';

  return <section className="mx-auto max-w-screen-xl px-3 pt-3 sm:px-6 sm:pt-5" aria-label={labels.aria}><div className="group relative overflow-hidden rounded-[26px] border border-white/70 bg-card shadow-premium dark:border-white/10" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
    {slide.kind === 'image' ? <div className="relative h-[260px] sm:h-[340px]"><picture>{slide.mobileImageUrl ? <source media="(max-width: 767px)" srcSet={slide.mobileImageUrl} /> : null}<Image src={slide.desktopImageUrl} alt={slide.title || 'ایشاپ'} fill priority={index === 0} sizes="(max-width: 767px) 100vw, 1200px" className="object-cover" /></picture><div className="absolute inset-0 bg-gradient-to-t from-slate-950/72 via-slate-900/12 to-transparent" aria-hidden="true" /><div key={slide.id} className={cn('absolute inset-x-0 bottom-0 p-4 sm:p-8 lg:p-10', !reduceMotion && 'hero-copy-in')} dir={isEnglish ? 'ltr' : 'rtl'}><div className="max-w-[86%] text-white sm:max-w-2xl"><span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-extrabold backdrop-blur-sm"><Sparkles className="h-3 w-3" />ایشاپ</span>{slide.title ? <h1 className="mt-2 line-clamp-2 text-xl font-black leading-[1.15] sm:text-4xl">{slide.title}</h1> : null}{slide.subtitle ? <p className="mt-1.5 line-clamp-2 max-w-xl text-[11px] leading-4 text-white/85 sm:text-sm sm:leading-7">{slide.subtitle}</p> : null}{slide.ctaLabel && slide.href ? <Link href={slide.href as never} className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-extrabold text-slate-900 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 sm:min-h-10 sm:px-4 sm:text-sm">{slide.ctaLabel}<ChevronLeft className="h-4 w-4 rtl:rotate-180" /></Link> : null}</div></div></div> : <div className={cn('relative h-[260px] overflow-hidden bg-gradient-to-br p-4 shadow-inner dark:text-white sm:h-[340px] sm:p-8', slide.theme)} dir={isEnglish ? 'ltr' : 'rtl'}><div className="absolute -end-24 -top-24 h-64 w-64 rounded-full bg-white/45 blur-3xl dark:bg-white/8" aria-hidden="true" /><div className="absolute -start-20 -bottom-28 h-64 w-64 rounded-full bg-white/32 blur-3xl dark:bg-white/5" aria-hidden="true" /><div className="absolute inset-y-0 end-0 hidden w-1/3 bg-gradient-to-l from-white/20 via-white/6 to-transparent sm:block" aria-hidden="true" /><div className="relative flex h-full items-center"><div className="max-w-[86%] sm:max-w-2xl"><div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/55 bg-white/48 px-3 py-1.5 text-[10px] font-extrabold text-slate-800 shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-white/10 dark:text-white"><Sparkles className="h-3 w-3" />ایشاپ</div><h1 className="line-clamp-2 text-xl font-black leading-[1.15] text-slate-900 drop-shadow-sm dark:text-white sm:text-4xl lg:text-5xl">{slide.title}</h1><p className="mt-2 line-clamp-2 max-w-xl text-[11px] font-medium leading-4 text-slate-700 sm:text-sm sm:leading-7 dark:text-white/80">{slide.subtitle}</p><Link href={slide.href as never} className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 via-fuchsia-500 to-sky-500 px-3 py-2 text-xs font-extrabold text-white shadow-lg shadow-fuchsia-900/10 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-xl sm:min-h-10 sm:px-4 sm:text-sm">{slide.ctaLabel}<ChevronLeft className="h-4 w-4 rtl:rotate-180" /></Link></div><div className="ms-auto hidden h-36 w-36 shrink-0 items-center justify-center rounded-[32px] border border-white/50 bg-white/32 shadow-xl backdrop-blur-md sm:flex lg:h-48 lg:w-48 dark:border-white/15 dark:bg-white/10" aria-hidden="true"><SlideIcon className="h-20 w-20 text-slate-800 drop-shadow-sm dark:text-white lg:h-24 lg:w-24" /></div></div></div>}
    {count > 1 ? <><button type="button" onClick={() => move(-1)} aria-label={labels.previous} className="absolute start-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/25 text-white shadow-sm backdrop-blur-sm transition hover:bg-black/40 sm:start-3"><ChevronRight className="h-4 w-4 rtl:rotate-180" /></button><button type="button" onClick={() => move(1)} aria-label={labels.next} className="absolute end-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/25 text-white shadow-sm backdrop-blur-sm transition hover:bg-black/40 sm:end-3"><ChevronLeft className="h-4 w-4 rtl:rotate-180" /></button><div className="absolute inset-x-0 bottom-2.5 z-10 flex justify-center gap-1.5 sm:bottom-3" aria-label="Slide progress">{slides.map((item, dot) => <button key={item.id} type="button" onClick={() => setIndex(dot)} aria-label={`${dot + 1}`} aria-current={index === dot} className={cn('h-1.5 rounded-full transition-all', index === dot ? 'w-7 bg-white' : 'w-1.5 bg-white/45')} />)}</div></> : null}
    <p className="absolute bottom-2.5 start-3 z-10 text-[9px] text-white/75 sm:hidden">{labels.swipe}</p>
  </div></section>;
}
