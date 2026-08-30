import type { ReactNode } from 'react';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { EshopLogo } from '@/components/eshop-logo';
import { localeDirection, type AppLocale } from '@/i18n/routing';

interface Props { children: ReactNode }

export default async function AuthLayout({ children }: Props) {
  const locale = await getLocale();
  const appLocale = locale as AppLocale;
  const direction = localeDirection[appLocale] ?? 'rtl';
  const copy = locale === 'en' ? { home: 'Go to homepage', rights: 'All rights reserved', tagline: 'A faster, simpler Afghan marketplace' } : locale === 'ps' ? { home: 'بېرته کورپاڼې ته', rights: 'ټول حقونه خوندي دي', tagline: 'ستاسې چټک او ساده افغان بازار' } : { home: 'رفتن به صفحه اصلی', rights: 'تمامی حقوق محفوظ است', tagline: 'بازار آنلاین سریع و ساده افغانستان' };

  return <div dir={direction} className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.10),transparent_42%),linear-gradient(to_bottom,hsl(var(--background)),hsl(var(--muted)/0.35))] px-4 py-7 sm:py-10">
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 opacity-60"><div className="absolute -start-40 -top-36 h-80 w-80 rounded-full bg-primary/10 blur-3xl" /><div className="absolute -end-40 bottom-0 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" /><div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.25)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.25)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" /></div>
    <Link href={`/${locale}`} className="group relative mb-5 flex items-center gap-3 rounded-2xl px-2 py-1.5 focus-visible:outline-none" aria-label={copy.home}><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary shadow-lg ring-4 ring-primary/10 transition-transform group-hover:scale-105"><EshopLogo size={31} variant="color" /></span><span><span className="block font-display text-xl font-black tracking-tight text-foreground">Eshop</span><span className="block text-[10px] font-medium text-muted-foreground">{copy.tagline}</span></span></Link>
    <div className="relative w-full max-w-md rounded-[30px] border border-white/40 bg-card/90 p-1 shadow-2xl shadow-primary/5 backdrop-blur-xl dark:border-white/5">{children}</div>
    <p className="relative mt-5 text-[10px] text-muted-foreground">© {new Date().getFullYear()} Eshop · {copy.rights}</p>
  </div>;
}
