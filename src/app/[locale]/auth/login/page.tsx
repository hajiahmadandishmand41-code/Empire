'use client';

import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { Lock, ShieldCheck } from 'lucide-react';
import { AuthForm } from '@/features/auth';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M24 9.5c3.1 0 5.7 1.1 7.8 2.9l5.8-5.8C34.2 3.4 29.4 1.5 24 1.5 14.8 1.5 7 7.4 3.7 15.5l6.8 5.3C12.1 14.3 17.5 9.5 24 9.5z" />
      <path fill="#34A853" d="M46.5 24c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3.2-2.4 5.8-4.9 7.6l7.5 5.8C43.5 37 46.5 31 46.5 24z" />
      <path fill="#FBBC05" d="M10.5 28.8c-.5-1.4-.8-2.8-.8-4.3s.3-3 .8-4.3l-6.8-5.3C2.1 17.8 1.5 20.8 1.5 24s.6 6.2 1.8 9.1l6.8-5.3z" />
      <path fill="#EA4335" d="M24 46.5c5.4 0 9.9-1.8 13.2-4.8l-7.5-5.8c-1.8 1.2-4.2 1.9-5.7 1.9-6.5 0-12-4.8-13.5-11.1l-6.8 5.3C7 40.6 14.8 46.5 24 46.5z" />
    </svg>
  );
}

export default function LoginPage() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const safeRedirect = redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/';
  const copy = locale === 'en' ? { title: 'Sign in to EmpireShop', subtitle: 'Welcome back. Sign in to continue.', google: 'Continue with Google', divider: 'or continue with password', secure: 'Secure sign-in', otp: 'Sign in with a one-time code' } : locale === 'ps' ? { title: 'EmpireShop ته ننوتل', subtitle: 'بیا ښه راغلاست. د دوام لپاره ننوتل وکړئ.', google: 'له Google سره ننوتل', divider: 'یا د پټنوم له لارې', secure: 'خوندي ننوتل', otp: 'د یو ځل کوډ سره ننوتل' } : { title: 'ورود به EmpireShop', subtitle: 'خوش آمدید. برای ادامه وارد حساب خود شوید.', google: 'ورود با Google', divider: 'یا با رمز عبور', secure: 'ورود امن', otp: 'ورود با کد یک‌بارمصرف' };

  return (
    <main id="main" className="flex min-h-[calc(100dvh-8rem)] items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8" aria-labelledby="login-title">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10" aria-hidden="true"><Lock className="h-6 w-6 text-primary" /></div>
            <h1 id="login-title" className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">{copy.title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{copy.subtitle}</p>
          </div>

          <a href={`/api/auth/google/start?locale=${encodeURIComponent(locale)}&redirect=${encodeURIComponent(safeRedirect)}`} className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none">
            <GoogleIcon /><span>{copy.google}</span>
          </a>

          <div className="relative my-5" aria-hidden="true"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div><div className="relative flex justify-center"><span className="bg-card px-3 text-[11px] font-medium text-muted-foreground">{copy.divider}</span></div></div>

          <AuthForm mode="login" />
        </section>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" /><span>{copy.secure}</span></div>
        <p className="mt-3 text-center text-xs text-muted-foreground"><Link href={`/${locale}/auth/otp-login?redirect=${encodeURIComponent(safeRedirect)}`} className="hover:text-primary hover:underline">{copy.otp}</Link></p>
      </div>
    </main>
  );
}
