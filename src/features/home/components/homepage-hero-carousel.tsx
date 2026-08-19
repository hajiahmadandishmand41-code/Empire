'use client';

import * as React from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { WishlistButton } from '@/features/wishlist';
import { ChevronLeft, ChevronRight, ShoppingBag, Sparkles, Star } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import type { ProductSummary } from '@/types';

/**
 * Hero direction: B — Split Layout.
 * Chosen for EmpireShop because it keeps product proof visible, stays compact on mobile,
 * and gives the marketplace a premium commerce feel without relying on a large hero video.
 */
export function HomepageHeroCarousel({ products, locale = 'fa', currency = 'AFN' }: { products: ProductSummary[]; locale?: string; currency?: string }) {
  const count = Math.min(products.length, 2);
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [swipeStart, setSwipeStart] = React.useState<number | null>(null);
  const labels = locale === 'en'
    ? { eyebrow: 'Featured on EmpireShop', cta: 'View product', next: 'Next product', prev: 'Previous product', buy: 'Shop now', swipe: 'Swipe to explore', save: 'Save to wishlist', saved: 'Saved to wishlist' }
    : locale === 'ps'
      ? { eyebrow: 'په EmpireShop کې ځانګړی', cta: 'محصول وګورئ', next: 'بل محصول', prev: 'مخکینی محصول', buy: 'اوس واخلئ', swipe: 'د لیدلو لپاره کش کړئ', save: 'خوښې ته اضافه', saved: 'له خوښو لرې کول' }
      : { eyebrow: 'انتخاب ویژه EmpireShop', cta: 'مشاهده کالا', next: 'محصول بعدی', prev: 'محصول قبلی', buy: 'خرید کنید', swipe: 'برای دیدن بکشید', save: 'افزودن به علاقه‌مندی‌ها', saved: 'حذف از علاقه‌مندی‌ها' };

  React.useEffect(() => {
    if (count < 2 || paused) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % count), 5000);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  if (count === 0) {
    return (
      <section className="mx-auto max-w-screen-xl px-3 pt-3 sm:px-6 sm:pt-5">
        <div className="overflow-hidden rounded-[24px] border border-border bg-card px-5 py-8 shadow-premium sm:px-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-[10px] font-bold text-accent-foreground"><Sparkles className="h-3.5 w-3.5" />EmpireShop</span>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-foreground sm:text-4xl">{locale === 'en' ? 'A new marketplace experience for Afghanistan' : locale === 'ps' ? 'د افغانستان لپاره نوی بازار تجربه' : 'تجربه‌ای تازه برای خرید آنلاین افغانستان'}</h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">{locale === 'en' ? 'Discover trusted products, local treasures and everyday essentials in one calm, fast marketplace.' : locale === 'ps' ? 'باوري محصولات او د افغانستان اصلي توکي په یوه چټک او ساده بازار کې ومومئ.' : 'محصولات قابل اعتماد، کالاهای روزمره و میراث اصیل افغانستان را در یک بازار آرام، سریع و حرفه‌ای پیدا کنید.'}</p>
            <Link href={'/shop' as never} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md"><ShoppingBag className="h-4 w-4" />{labels.buy}<ChevronLeft className="h-4 w-4 rtl:rotate-180" /></Link>
          </div>
        </div>
      </section>
    );
  }

  const product = products[index] ?? products[0];
  const image = product.images?.[0]?.src ?? null;
  const rating = product.averageRating ?? 0;
  const discount = product.comparePrice && product.comparePrice > product.price ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) { setSwipeStart(event.clientX); }
  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (swipeStart === null || count < 2) return;
    const delta = event.clientX - swipeStart;
    if (Math.abs(delta) > 45) setIndex((value) => (value + (delta < 0 ? 1 : -1) + count) % count);
    setSwipeStart(null);
  }

  return (
    <section className="mx-auto max-w-screen-xl px-3 pt-3 sm:px-6 sm:pt-5" aria-label={labels.eyebrow}>
      <div className="group relative overflow-hidden rounded-[24px] border border-border bg-card shadow-premium" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,hsl(var(--primary)/.10),transparent_30%),radial-gradient(circle_at_88%_88%,hsl(var(--color-brand-secondary)/.10),transparent_28%)]" aria-hidden />
        <div className="relative grid min-h-[360px] items-stretch lg:grid-cols-[1.02fr_.98fr]">
          <div className="order-2 flex flex-col justify-center px-5 py-8 sm:px-8 sm:py-10 lg:order-1 lg:px-12">
            <div className="flex items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-accent px-3 py-1.5 text-[10px] font-extrabold text-accent-foreground"><Sparkles className="h-3 w-3" />{labels.eyebrow}</span>{discount > 0 && <span className="rounded-full bg-price-sale px-2.5 py-1 text-[10px] font-extrabold text-white">-{discount}٪</span>}</div>
            <div key={product.id} className="hero-copy-in mt-4 max-w-2xl">
              <p className="text-xs font-semibold text-primary">{product.sellerShopName ?? (locale === 'en' ? 'Trusted seller' : locale === 'ps' ? 'باوري پلورونکی' : 'فروشنده معتبر')}</p>
              <h1 className="mt-2 text-3xl font-black leading-[1.22] tracking-tight text-foreground sm:text-4xl lg:text-[46px]">{product.name}</h1>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">{rating > 0 && <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-price-warning text-price-warning" />{rating.toFixed(1)}</span>}{product.sellerShopName && <span className="truncate">{product.sellerShopName}</span>}</div>
            </div>
            <div className="mt-5 flex items-end gap-3"><span className="text-2xl font-black text-price-current sm:text-3xl">{formatPrice(product.price, currency, locale)}</span>{product.comparePrice && product.comparePrice > product.price && <span className="text-sm text-muted-foreground line-through">{formatPrice(product.comparePrice, currency, locale)}</span>}</div>
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <Link href={`/shop/${product.slug}` as never} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-extrabold text-primary-foreground shadow-sm transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md"><ShoppingBag className="h-4 w-4" />{labels.cta}<ChevronLeft className="h-4 w-4 rtl:rotate-180" /></Link>
              <WishlistButton slug={product.slug} size="lg" labelOn={labels.saved} labelOff={labels.save} />
            </div>
            <p className="mt-3 text-[10px] font-medium text-muted-foreground sm:hidden">{labels.swipe}</p>
          </div>
          <div className="order-1 flex min-h-[240px] items-center justify-center overflow-hidden bg-muted/40 p-3 sm:p-5 lg:order-2 lg:min-h-full lg:p-8">
            <Link href={`/shop/${product.slug}` as never} className="hero-image-reveal relative block aspect-[1.08/1] w-full max-w-[520px] overflow-hidden rounded-[22px] border border-white/70 bg-white shadow-sm dark:border-border dark:bg-card">
              {image ? <Image src={image} alt={product.name} fill priority={index === 0} sizes="(max-width: 1024px) 94vw, 52vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.018]" /> : <div className="flex h-full items-center justify-center"><Sparkles className="h-16 w-16 text-primary/40" /></div>}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" aria-hidden />
              <span className="absolute start-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/85 px-2.5 py-1 text-[10px] font-bold text-foreground shadow-sm backdrop-blur-sm dark:border-border dark:bg-card/85"><Star className="h-3 w-3 fill-price-warning text-price-warning" />{rating > 0 ? rating.toFixed(1) : '—'}</span>
            </Link>
          </div>
        </div>
        {count > 1 && <><button type="button" onClick={() => setIndex((value) => (value - 1 + count) % count)} aria-label={labels.prev} className="absolute start-3 top-[38%] z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-sm backdrop-blur-sm transition-transform duration-150 hover:scale-105 lg:start-auto lg:end-[calc(50%+20px)]"><ChevronRight className="h-4 w-4 rtl:rotate-180" /></button><button type="button" onClick={() => setIndex((value) => (value + 1) % count)} aria-label={labels.next} className="absolute end-3 top-[38%] z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-sm backdrop-blur-sm transition-transform duration-150 hover:scale-105 lg:end-4"><ChevronLeft className="h-4 w-4 rtl:rotate-180" /></button><div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 lg:bottom-4">{Array.from({ length: count }).map((_, dot) => <button key={dot} type="button" onClick={() => setIndex(dot)} aria-label={`Slide ${dot + 1}`} aria-current={index === dot} className={cn('h-1.5 rounded-full transition-all duration-200', index === dot ? 'w-7 bg-primary' : 'w-1.5 bg-muted-foreground/25')} />)}</div></>}
      </div>
    </section>
  );
}
