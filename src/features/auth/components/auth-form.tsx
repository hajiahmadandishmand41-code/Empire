'use client';

import { useState, type FormEvent, useId } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Eye, EyeOff, Loader2, CheckCircle2, User, Lock, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useLocale } from 'next-intl';

type Mode = 'login' | 'register';

interface Props {
  mode: Mode;
}

interface ApiFailure {
  ok: false;
  error: { code: string; message: string };
}

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'ایمیل/شماره یا رمز عبور اشتباه است',
  USER_EXISTS: 'این ایمیل یا شماره قبلاً ثبت شده است',
  TOO_MANY_REQUESTS: 'تعداد تلاش زیاد است، چند دقیقه صبر کنید',
  VALIDATION_ERROR: 'اطلاعات وارد شده معتبر نیست',
  INTERNAL_ERROR: 'خطای سرور — لطفاً دوباره تلاش کنید',
};

export function AuthForm({ mode }: Props) {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const uid = useId();

  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /** Password strength indicator (register only) */
  const pwStrength = (() => {
    if (!password || mode !== 'register') return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    return score;
  })();

  const pwStrengthLabel = ['', 'ضعیف', 'متوسط', 'خوب', 'قوی', 'عالی'][pwStrength] ?? '';
  const pwStrengthColor = [
    '',
    'bg-red-400',
    'bg-orange-400',
    'bg-yellow-400',
    'bg-green-400',
    'bg-emerald-500',
  ][pwStrength] ?? '';

  const passwordMismatch =
    mode === 'register' && confirmPassword.length > 0 && confirmPassword !== password;

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

    if (mode === 'register' && password !== confirmPassword) {
      setError('رمز عبور و تکرار آن یکسان نیستند');
      return;
    }

    setLoading(true);
    try {
      const url = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload =
        mode === 'register'
          ? { fullName: fullName.trim(), identifier: identifier.trim(), password, confirmPassword }
          : { identifier: identifier.trim(), password };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'same-origin',
      });

      const data = (await res.json()) as ApiFailure | { ok: true };

      if (!res.ok || !data.ok) {
        const code = (data as ApiFailure)?.error?.code ?? '';
        const fallback = (data as ApiFailure)?.error?.message ?? 'خطایی رخ داد، لطفاً دوباره تلاش کنید';
        setError(ERROR_MESSAGES[code] ?? fallback);
        return;
      }

      setSuccess(true);
      router.replace(getSafeRedirect());
      router.refresh();
    } catch {
      setError('خطای ارتباط با سرور — اتصال اینترنت خود را بررسی کنید');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 ring-4 ring-green-100">
          <CheckCircle2 className="h-7 w-7 text-green-500" />
        </div>
        <p className="font-semibold text-foreground">
          {mode === 'register' ? 'حساب کاربری ایجاد شد!' : 'ورود موفق!'}
        </p>
        <p className="text-sm text-muted-foreground">در حال انتقال…</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {mode === 'register' && (
        <div className="space-y-1.5">
          <Label htmlFor={`${uid}-fullName`} className="text-sm font-medium text-foreground">
            نام و نام خانوادگی <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <User className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              id={`${uid}-fullName`}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
              maxLength={80}
              placeholder="مثلاً احمد کریمی"
              className="h-11 rounded-xl border-border bg-muted/40 dark:bg-muted/20 ps-10 text-sm transition focus:border-rose-400 focus:bg-background focus:ring-2 focus:ring-rose-400/15"
            />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor={`${uid}-identifier`} className="text-sm font-medium text-foreground">
          ایمیل یا شماره موبایل <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id={`${uid}-identifier`}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoComplete={mode === 'register' ? 'email' : 'username'}
            maxLength={120}
            dir="ltr"
            placeholder="example@email.com یا 0700000000"
            className="h-11 rounded-xl border-border bg-muted/40 dark:bg-muted/20 ps-10 text-sm transition focus:border-rose-400 focus:bg-background focus:ring-2 focus:ring-rose-400/15"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor={`${uid}-password`} className="text-sm font-medium text-foreground">
            رمز عبور <span className="text-red-500">*</span>
          </Label>
          {mode === 'login' && (
            <Link
              href={`/${locale}/auth/forgot-password`}
              className="text-xs text-rose-600 hover:text-rose-700 hover:underline"
            >
              فراموشی رمز عبور؟
            </Link>
          )}
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id={`${uid}-password`}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            minLength={8}
            maxLength={128}
            placeholder={mode === 'register' ? 'حداقل ۸ کاراکتر' : 'رمز عبور خود را وارد کنید'}
            className="h-11 rounded-xl border-border bg-muted/40 dark:bg-muted/20 ps-10 pe-11 text-sm transition focus:border-rose-400 focus:bg-background focus:ring-2 focus:ring-rose-400/15"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute end-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
          </button>
        </div>

        {/* Password strength meter — register only */}
        {mode === 'register' && password.length > 0 && (
          <div className="space-y-1 pt-0.5">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-all duration-300',
                    level <= pwStrength ? pwStrengthColor : 'bg-muted',
                  )}
                />
              ))}
            </div>
            <p className={cn('text-[11px]', pwStrength <= 1 ? 'text-red-500' : pwStrength <= 3 ? 'text-yellow-600' : 'text-green-600')}>
              قدرت رمز: {pwStrengthLabel}
            </p>
          </div>
        )}
      </div>

      {mode === 'register' && (
        <div className="space-y-1.5">
          <Label htmlFor={`${uid}-confirmPassword`} className="text-sm font-medium text-foreground">
            تکرار رمز عبور <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              id={`${uid}-confirmPassword`}
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              aria-invalid={passwordMismatch}
              aria-describedby={passwordMismatch ? `${uid}-pw-mismatch` : undefined}
              placeholder="رمز عبور را مجدداً وارد کنید"
              className={cn(
                'h-11 rounded-xl border-border bg-muted/40 dark:bg-muted/20 ps-10 pe-11 text-sm transition focus:border-rose-400 focus:bg-background focus:ring-2 focus:ring-rose-400/15',
                passwordMismatch && 'border-red-300 focus:border-red-400 focus:ring-red-400/15 bg-red-50/30',
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute end-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label={showConfirm ? 'مخفی کردن رمز' : 'نمایش رمز'}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
            </button>
          </div>
          {passwordMismatch && (
            <p id={`${uid}-pw-mismatch`} role="alert" className="text-xs text-red-500">
              رمز عبور و تکرار آن یکسان نیستند
            </p>
          )}
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={loading || passwordMismatch}
        size="lg"
        className="w-full gap-2 btn-primary-premium h-11 rounded-xl font-semibold disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            <span>در حال ارسال…</span>
          </>
        ) : mode === 'register' ? (
          'ایجاد حساب کاربری'
        ) : (
          'ورود به حساب'
        )}
      </Button>

      {/* Footer links */}
      <p className="text-center text-xs text-muted-foreground">
        {mode === 'login' ? (
          <>
            حساب ندارید؟{' '}
            <Link href={`/${locale}/auth/register`} className="text-rose-600 font-medium hover:underline">
              ثبت‌نام کنید
            </Link>
          </>
        ) : (
          <>
            قبلاً ثبت‌نام کرده‌اید؟{' '}
            <Link href={`/${locale}/auth/login`} className="text-rose-600 font-medium hover:underline">
              وارد شوید
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
