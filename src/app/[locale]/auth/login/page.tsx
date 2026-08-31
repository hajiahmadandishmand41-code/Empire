'use client';

import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { ArrowRight, LockKeyhole, ShieldCheck, ShoppingBag } from 'lucide-react';
import { AuthForm } from '@/features/auth';

export default function LoginPage() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const safeRedirect = redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/';
  const copy = locale === 'en'
    ? { title: 'Welcome back', subtitle: 'Sign in to continue shopping on Eshop.', secure: 'Secure password sign-in', back: 'Back to shop', register: 'Create a new account' }
    : locale === 'ps'
      ? { title: 'بیا ښه راغلاست', subtitle: 'د Eshop پیرود ته د دوام لپاره ننوزئ.', secure: 'خوندي د پټنوم ننوتل', back: 'هټۍ ته ستنېدل', register: 'نوی حساب جوړ کړئ' }
      : { title: 'خوش آمدید', subtitle: 'برای ادامه خرید در Eshop وارد حساب خود شوید.', secure: 'ورود امن با رمز عبور', back: 'بازگشت به فروشگاه', register: 'ایجاد حساب جدید' };

  return (
    <main id="main" className="relative min-h-[calc(100dvh-8rem)] overflow-hidden bg-gradient-to-b from-primary/[0.08] via-background to-background px-4 py-8 sm:py-12" dir={locale === 'en' ? 'ltr' : 'rtl'}>
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_top,rgba(59,130,246,.14),transparent_34%)]" />
      <div className="relative mx-auto grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[1fr_440px]">
        <section className="hidden rounded-[2.5rem] border border-border/70 bg-card/70 p-8 shadow-sm backdrop-blur lg:block lg:p-10">
          <div className="mb-8 flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><ShoppingBag className="h-6 w-6" /></span><div><p className="text-xs font-bold text-primary">Eshop</p><h2 className="mt-1 text-2xl font-black">{copy.back}</h2></div></div>
          <p className="max-w-md text-sm leading-8 text-muted-foreground">{copy.subtitle}</p>
          <div className="mt-8 grid gap-3"><div className="rounded-2xl border border-border bg-background/70 p-4"><p className="text-sm font-bold">{locale === 'en' ? 'One account for your orders' : locale === 'ps' ? 'یو حساب ستاسو د سپارښتنو لپاره' : 'یک حساب برای مدیریت سفارش‌ها'}</p></div><div className="rounded-2xl border border-border bg-background/70 p-4"><p className="text-sm font-bold">{locale === 'en' ? 'Seller and customer areas stay separate' : locale === 'ps' ? 'د پلورونکي او پیرودونکي برخې جلا دي' : 'بخش فروشنده و مشتری کاملاً جداست'}</p></div></div>
        </section>
        <section className="relative rounded-[2.5rem] border border-border bg-card p-6 shadow-xl shadow-primary/5 sm:p-8" aria-labelledby="login-title">
          <Link href={`/${locale}`} className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary"><ArrowRight className="h-4 w-4 rtl:rotate-180" />{copy.back}</Link>
          <div className="mb-7 text-center"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><LockKeyhole className="h-7 w-7" /></div><h1 id="login-title" className="text-2xl font-black tracking-tight sm:text-3xl">{copy.title}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.subtitle}</p></div>
          <AuthForm mode="login" />
          <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /><span>{copy.secure}</span></div>
          <p className="mt-4 text-center text-xs text-muted-foreground"><Link href={`/${locale}/auth/register?redirect=${encodeURIComponent(safeRedirect)}`} className="font-bold text-primary hover:underline">{copy.register}</Link></p>
        </section>
      </div>
    </main>
  );
}
