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
  const copy = locale === 'en' ? { home: 'Go to homepage', rights: 'All rights reserved' } : locale === 'ps' ? { home: 'بېرته کورپاڼې ته', rights: 'ټول حقونه خوندي دي' } : { home: 'رفتن به صفحه اصلی', rights: 'تمامی حقوق محفوظ است' };

  return (
    <div dir={direction} className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-4 py-8 sm:py-10">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden"><div className="absolute -start-40 -top-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" /><div className="absolute -end-32 bottom-0 h-72 w-72 rounded-full bg-accent/20 blur-3xl" /></div>
      <Link href={`/${locale}`} className="group relative mb-7 flex items-center gap-2.5 rounded-xl focus-visible:outline-none" aria-label={copy.home}>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary shadow-lg transition-transform group-hover:scale-105" aria-hidden="true"><EshopLogo size={30} variant="color" /></span>
        <span className="font-display text-lg font-extrabold tracking-tight text-foreground">Eshop</span>
      </Link>
      <div className="relative w-full max-w-md">{children}</div>
      <p className="relative mt-7 text-xs text-muted-foreground">© {new Date().getFullYear()} Eshop · {copy.rights}</p>
    </div>
  );
}
