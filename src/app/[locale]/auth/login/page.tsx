'use client';

/**
 * Login page — Stage 5
 * Replaced all hardcoded colors (gray-50/950/900/200/800/700 etc.) with
 * semantic design tokens (bg-background, bg-card, border-border, etc.)
 */

import { useState, type FormEvent, useId } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertCircle, Eye, EyeOff, Loader2, CheckCircle2,
  Lock, ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { EmpireLogo } from '@/components/empire-logo';

interface ApiFailure {
  ok: false;
  error: { code: string; message: string };
}

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'ایمیل/شماره یا رمز عبور اشتباه است',
  TOO_MANY_REQUESTS: 'تعداد تلاش زیاد است، چند دقیقه صبر کنید',
  VALIDATION_ERROR: 'اطلاعات وارد شده معتبر نیست',
  INTERNAL_ERROR: 'خطای سرور — لطفاً دوباره تلاش کنید',
};

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const uid = useId();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function getSafeRedirect(): string {
    const requested = searchParams.get('redirect');
    if (!requested || !requested.startsWith('/') || requested.startsWith('//')) {
      return '/';
    }
    return requested;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
        credentials: 'same-origin',
      });
      const data = (await res.json()) as ApiFailure | { ok: true };
      if (!res.ok || !data.ok) {
        const code = (data as ApiFailure)?.error?.code ?? '';
        setError(ERROR_MESSAGES[code] ?? (data as ApiFailure)?.error?.message ?? 'خطای ناشناخته');
        return;
      }
      setSuccess(true);
      router.replace(getSafeRedirect());
      router.refresh();
    } catch {
      setError('اتصال به سرور ممکن نیست');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Compact header */}
      <header className="bg-card border-b border-border px-4 py-3">
        <div className="mx-auto max-w-screen-xl">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2.5 w-fit group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
            aria-label="Empire Shop — صفحه اصلی"
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-sm transition-all group-hover:opacity-90"
              aria-hidden="true"
            >
              <EmpireLogo size={24} variant="color" />
            </div>
            <span className="font-display text-sm font-extrabold text-foreground">
              EmpireShop
            </span>
          </Link>
        </div>
      </header>

      {/* Form area */}
      <main id="main" className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            {/* Title */}
            <div className="mb-6 text-center">
              <div
                className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10"
                aria-hidden="true"
              >
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-lg font-extrabold text-foreground">ورود به حساب</h1>
              <p className="mt-1 text-sm text-muted-foreground">خوش آمدید! لطفاً وارد شوید</p>
            </div>

            {/* Google OAuth */}
            <a
              href={`/api/auth/google/start?locale=${encodeURIComponent(locale)}&redirect=${encodeURIComponent(getSafeRedirect())}`}
              className="mb-4 flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#4285F4" d="M24 9.5c3.1 0 5.7 1.1 7.8 2.9l5.8-5.8C34.2 3.4 29.4 1.5 24 1.5 14.8 1.5 7 7.4 3.7 15.5l6.8 5.3C12.1 14.3 17.5 9.5 24 9.5z"/>
                <path fill="#34A853" d="M46.5 24c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3.2-2.4 5.8-4.9 7.6l7.5 5.8C43.5 37 46.5 31 46.5 24z"/>
                <path fill="#FBBC05" d="M10.5 28.8c-.5-1.4-.8-2.8-.8-4.3s.3-3 .8-4.3l-6.8-5.3C2.1 17.8 1.5 20.8 1.5 24s.6 6.2 1.8 9.1l6.8-5.3z"/>
                <path fill="#EA4335" d="M24 46.5c5.4 0 9.9-1.8 13.2-4.8l-7.5-5.8c-1.8 1.2-4.2 1.9-5.7 1.9-6.5 0-12-4.8-13.5-11.1l-6.8 5.3C7 40.6 14.8 46.5 24 46.5z"/>
                <path fill="none" d="M1.5 1.5h45v45h-45z"/>
              </svg>
              ورود با Google
            </a>

            {/* Divider */}
            <div className="relative my-4" aria-hidden="true">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-2 text-[11px] text-muted-foreground font-medium">یا با رمز عبور</span>
              </div>
            </div>

            <form onSubmit={onSubmit} noValidate className="space-y-4" aria-label="فرم ورود">
              {/* Identifier */}
              <div className="space-y-1">
                <Label
                  htmlFor={`${uid}-id`}
                  className="block text-xs font-semibold text-foreground"
                >
                  ایمیل یا شماره موبایل
                </Label>
                <Input
                  id={`${uid}-id`}
                  type="text"
                  inputMode="email"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="example@email.com یا ۰۷۰۰۰۰۰۰۰۰"
                  required
                  dir="ltr"
                  className="h-10 rounded-xl text-sm bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                  aria-required="true"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor={`${uid}-pw`}
                    className="text-xs font-semibold text-foreground"
                  >
                    رمز عبور
                  </Label>
                  <Link
                    href={`/${locale}/auth/forgot-password`}
                    className="text-[11px] text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  >
                    فراموش کردم
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id={`${uid}-pw`}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="رمز عبور"
                    required
                    dir="ltr"
                    className="h-10 rounded-xl pe-10 text-sm bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                    aria-required="true"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              {/* Error / success states */}
              {error && (
                <div
                  className={cn(
                    'flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-xs text-destructive',
                  )}
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {error}
                </div>
              )}
              {success && (
                <div
                  className="flex items-center gap-2 rounded-xl border border-emerald-200/50 bg-emerald-50/50 dark:bg-emerald-950/30 dark:border-emerald-900/50 px-3 py-2.5 text-xs text-emerald-700 dark:text-emerald-400"
                  role="status"
                  aria-live="polite"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  ورود موفق — در حال انتقال...
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || success}
                className="w-full h-10 rounded-xl bg-primary text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60 shadow-sm"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  'ورود به حساب'
                )}
              </Button>
            </form>

            {/* Links */}
            <div className="mt-5 space-y-2 text-center text-xs text-muted-foreground">
              <p>
                حساب ندارید؟{' '}
                <Link
                  href={`/${locale}/auth/register`}
                  className="font-bold text-primary hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  ثبت‌نام کنید
                </Link>
              </p>
              <p>
                <Link
                  href={`/${locale}/auth/otp-login`}
                  className="text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                  ورود با کد یک‌بارمصرف
                </Link>
              </p>
            </div>
          </div>

          {/* Trust badge */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
            <span>اتصال امن و رمزنگاری‌شده</span>
          </div>
        </div>
      </main>
    </div>
  );
}
