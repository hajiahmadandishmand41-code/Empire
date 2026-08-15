'use client';

/**
 * Register page — Stage 5
 * Replaced all hardcoded colors with semantic design tokens
 */

import { useState, type FormEvent, useId } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertCircle, Eye, EyeOff, Loader2, CheckCircle2,
  Lock, User, ShieldCheck,
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
  USER_EXISTS:       'این ایمیل یا شماره قبلاً ثبت شده است',
  TOO_MANY_REQUESTS: 'تعداد تلاش زیاد است، چند دقیقه صبر کنید',
  VALIDATION_ERROR:  'اطلاعات وارد شده معتبر نیست',
  INTERNAL_ERROR:    'خطای سرور — لطفاً دوباره تلاش کنید',
};

export default function RegisterPage() {
  const router   = useRouter();
  const locale   = useLocale();
  const searchParams = useSearchParams();
  const uid      = useId();

  const [fullName,         setFullName]         = useState('');
  const [identifier,       setIdentifier]       = useState('');
  const [password,         setPassword]         = useState('');
  const [confirmPassword,  setConfirmPassword]  = useState('');
  const [error,            setError]            = useState<string | null>(null);
  const [success,          setSuccess]          = useState(false);
  const [loading,          setLoading]          = useState(false);
  const [showPassword,     setShowPassword]     = useState(false);
  const [showConfirm,      setShowConfirm]      = useState(false);

  /** Password strength 0–5 */
  const pwStrength = (() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8)          score++;
    if (password.length >= 12)         score++;
    if (/[A-Z]/.test(password))        score++;
    if (/[0-9]/.test(password))        score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    return score;
  })();

  const pwLabels = ['', 'ضعیف', 'متوسط', 'خوب', 'قوی', 'عالی'];
  const pwColors = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-emerald-500'];
  const passwordMismatch = confirmPassword.length > 0 && confirmPassword !== password;

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
    if (password !== confirmPassword) {
      setError('رمز عبور و تکرار آن یکسان نیستند');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          identifier: identifier.trim(),
          password,
          confirmPassword,
        }),
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

      <main id="main" className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            {/* Title */}
            <div className="mb-6 text-center">
              <div
                className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10"
                aria-hidden="true"
              >
                <User className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-lg font-extrabold text-foreground">ثبت‌نام در EmpireShop</h1>
              <p className="mt-1 text-sm text-muted-foreground">حساب رایگان بسازید</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-3" noValidate aria-label="فرم ثبت‌نام">
              {/* Full name */}
              <div>
                <Label htmlFor={`${uid}-name`} className="mb-1.5 block text-xs font-semibold text-foreground">
                  نام کامل
                </Label>
                <div className="relative">
                  <User
                    className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id={`${uid}-name`}
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="نام و نام خانوادگی"
                    aria-required="true"
                    className="ps-9 h-10 text-sm bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                  />
                </div>
              </div>

              {/* Email / phone */}
              <div>
                <Label htmlFor={`${uid}-id`} className="mb-1.5 block text-xs font-semibold text-foreground">
                  ایمیل یا شماره تلفن
                </Label>
                <Input
                  id={`${uid}-id`}
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  placeholder="example@email.com"
                  aria-required="true"
                  className="h-10 text-sm bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                />
              </div>

              {/* Password */}
              <div>
                <Label htmlFor={`${uid}-pw`} className="mb-1.5 block text-xs font-semibold text-foreground">
                  رمز عبور
                </Label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id={`${uid}-pw`}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="حداقل ۸ کاراکتر"
                    dir="ltr"
                    aria-required="true"
                    className="ps-9 pe-10 h-10 text-sm bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  >
                    {showPassword
                      ? <EyeOff className="h-4 w-4" aria-hidden="true" />
                      : <Eye className="h-4 w-4" aria-hidden="true" />
                    }
                  </button>
                </div>
                {/* Password strength bar */}
                {password.length > 0 && (
                  <div className="mt-2" aria-label={`قدرت رمز عبور: ${pwLabels[pwStrength]}`}>
                    <div className="flex gap-0.5 h-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            'flex-1 rounded-full transition-all',
                            i < pwStrength ? pwColors[pwStrength] : 'bg-border',
                          )}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">{pwLabels[pwStrength]}</p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <Label htmlFor={`${uid}-cpw`} className="mb-1.5 block text-xs font-semibold text-foreground">
                  تکرار رمز عبور
                </Label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id={`${uid}-cpw`}
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="تکرار رمز عبور"
                    dir="ltr"
                    aria-required="true"
                    aria-describedby={passwordMismatch ? `${uid}-cpw-err` : undefined}
                    className={cn(
                      'ps-9 pe-10 h-10 text-sm bg-background text-foreground placeholder:text-muted-foreground',
                      passwordMismatch
                        ? 'border-destructive focus:border-destructive'
                        : 'border-border focus:border-primary',
                    )}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={showConfirm ? 'مخفی کردن رمز' : 'نمایش رمز'}
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
                {passwordMismatch && (
                  <p id={`${uid}-cpw-err`} className="mt-1 text-xs text-destructive" role="alert">
                    رمزها یکسان نیستند
                  </p>
                )}
              </div>

              {/* Alerts */}
              {error && (
                <div
                  className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-xs text-destructive"
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
                  ثبت‌نام موفق — در حال انتقال...
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || success || passwordMismatch}
                className="w-full h-10 rounded-xl bg-primary text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60 shadow-sm"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : 'ثبت‌نام'}
              </Button>
            </form>

            {/* Links */}
            <div className="mt-5 text-center text-xs text-muted-foreground">
              حساب دارید؟{' '}
              <Link
                href={`/${locale}/auth/login`}
                className="font-bold text-primary hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                ورود کنید
              </Link>
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
