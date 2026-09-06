'use client';

import { useEffect } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';

const COPY = {
  fa: {
    title: 'خطایی رخ داد',
    body: 'متأسفانه در بارگذاری این صفحه مشکلی پیش آمد. لطفاً دوباره تلاش کنید؛ اگر مشکل ادامه داشت به صفحه اصلی بازگردید.',
    retry: 'تلاش مجدد',
    home: 'صفحه اصلی',
    code: 'کد خطا',
  },
  ps: {
    title: 'یوه ستونزه رامنځته شوه',
    body: 'د دې مخ په پرانیستلو کې ستونزه رامنځته شوه. مهرباني وکړئ بیا هڅه وکړئ؛ که ستونزه دوام وکړي، اصلي مخ ته ورشئ.',
    retry: 'بیا هڅه وکړئ',
    home: 'اصلي مخ',
    code: 'د تېروتنې کود',
  },
  en: {
    title: 'Something went wrong',
    body: 'We could not load this page. Please try again — if the problem continues, head back to the homepage.',
    retry: 'Try again',
    home: 'Go home',
    code: 'Error code',
  },
} as const;

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // `useLocale` keeps this screen in the visitor's language. It previously
  // rendered Persian-only copy, so English and Pashto users hit a wall of
  // text they could not read at exactly the moment they needed guidance.
  const locale = useLocale();
  const copy = COPY[(locale as keyof typeof COPY) in COPY ? (locale as keyof typeof COPY) : 'fa'];

  useEffect(() => {
    console.error('[LocaleError]', error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-md flex-col items-center gap-5 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/20">
          <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">{copy.title}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{copy.body}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {copy.retry}
          </button>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-bold text-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            {copy.home}
          </Link>
        </div>

        {error.digest ? (
          <p className="text-[11px] text-muted-foreground" dir="ltr">
            {copy.code}: <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{error.digest}</code>
          </p>
        ) : null}
      </div>
    </div>
  );
}
