'use client';

import { useState, type FormEvent, useId, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const locale = useLocale();
  const copy = locale === 'en' ? { title: 'Reset password', subtitle: 'Choose a new password for your account.', password: 'New password', confirm: 'Confirm new password', hint: 'At least 8 characters', mismatch: 'Passwords do not match.', invalid: 'This reset link is invalid or incomplete.', loading: 'Updating…', submit: 'Reset password', success: 'Password updated successfully', redirecting: 'Redirecting to sign in…', back: 'Sign in', secure: 'Secure connection', show: 'Show password', hide: 'Hide password', error: 'We could not update your password.' } : locale === 'ps' ? { title: 'د پټنوم بیا تنظیمول', subtitle: 'د خپل حساب لپاره نوی پټنوم وټاکئ.', password: 'نوی پټنوم', confirm: 'نوی پټنوم بیا ولیکئ', hint: 'لږ تر لږه ۸ توري', mismatch: 'پټنومونه یو شان نه دي.', invalid: 'د بیا تنظیم لینک ناسم یا نیمګړی دی.', loading: 'بدلېږي…', submit: 'پټنوم بیا تنظیمول', success: 'پټنوم په بریالیتوب بدل شو', redirecting: 'د ننوتلو پاڼې ته لېږدول کېږي…', back: 'ننوتل', secure: 'خوندي اړیکه', show: 'پټنوم ښکاره کړئ', hide: 'پټنوم پټ کړئ', error: 'پټنوم بدلول ممکن نه شول.' } : { title: 'بازنشانی رمز عبور', subtitle: 'برای حساب خود یک رمز عبور جدید انتخاب کنید.', password: 'رمز عبور جدید', confirm: 'تکرار رمز عبور جدید', hint: 'حداقل ۸ کاراکتر', mismatch: 'رمزها یکسان نیستند.', invalid: 'لینک بازنشانی نامعتبر یا ناقص است.', loading: 'در حال تغییر…', submit: 'بازنشانی رمز عبور', success: 'رمز عبور با موفقیت تغییر کرد', redirecting: 'در حال انتقال به صفحه ورود…', back: 'ورود به حساب', secure: 'اتصال امن', show: 'نمایش رمز', hide: 'مخفی کردن رمز', error: 'تغییر رمز عبور انجام نشد.' };
  const uid = useId();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordMismatch = confirmPassword.length > 0 && confirmPassword !== password;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!token) { setError(copy.invalid); return; }
    if (password.length < 8) { setError(copy.hint); return; }
    if (password !== confirmPassword) { setError(copy.mismatch); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password, confirmPassword }), credentials: 'same-origin' });
      const data = await res.json();
      if (!res.ok || !data.ok) { setError(data?.error?.message ?? copy.error); return; }
      setSuccess(true);
      window.setTimeout(() => router.push(`/${locale}/auth/login`), 1800);
    } catch {
      setError(copy.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8" aria-labelledby="reset-password-title">
      <div className="mb-6 text-center"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10" aria-hidden="true"><Lock className="h-6 w-6 text-primary" /></div><h1 id="reset-password-title" className="text-xl font-extrabold">{copy.title}</h1><p className="mt-1.5 text-sm text-muted-foreground">{copy.subtitle}</p></div>
      {success ? <div className="space-y-4 text-center" role="status" aria-live="polite"><div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200/60 bg-emerald-50/70 px-4 py-4 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400"><CheckCircle2 className="h-5 w-5" aria-hidden="true" /><span className="font-semibold">{copy.success}</span></div><p className="text-xs text-muted-foreground">{copy.redirecting}</p><Link href={`/${locale}/auth/login`} className="text-sm font-semibold text-primary hover:underline">{copy.back}</Link></div> : <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5"><Label htmlFor={`${uid}-pw`} className="text-sm font-medium">{copy.password}</Label><div className="relative"><Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id={`${uid}-pw`} type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} maxLength={128} placeholder={copy.hint} className="h-11 rounded-xl ps-9 pe-11" dir="ltr" /><button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute end-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground" aria-label={showPassword ? copy.hide : copy.show}>{showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}</button></div></div>
        <div className="space-y-1.5"><Label htmlFor={`${uid}-confirm`} className="text-sm font-medium">{copy.confirm}</Label><div className="relative"><Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id={`${uid}-confirm`} type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} maxLength={128} aria-invalid={passwordMismatch} className={cn('h-11 rounded-xl ps-9 pe-11', passwordMismatch && 'border-destructive')} placeholder={copy.confirm} dir="ltr" /><button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute end-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground" aria-label={showConfirm ? copy.hide : copy.show}>{showConfirm ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}</button></div>{passwordMismatch && <p className="text-xs text-destructive" role="alert">{copy.mismatch}</p>}</div>
        {error && <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3.5 py-3 text-sm text-destructive" role="alert" aria-live="polite"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{error}</div>}
        <Button type="submit" disabled={loading || passwordMismatch} className="h-11 w-full rounded-xl font-semibold">{loading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{copy.loading}</> : copy.submit}</Button>
        <div className="text-center"><Link href={`/${locale}/auth/login`} className="text-xs text-muted-foreground hover:text-primary hover:underline">{copy.back}</Link></div>
      </form>}
    </section>
  );
}

export default function ResetPasswordPage() {
  return <main id="main" className="flex min-h-[calc(100dvh-8rem)] items-center justify-center px-4 py-8 sm:py-12"><div className="w-full max-w-md"><Suspense fallback={<div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>}><ResetPasswordForm /></Suspense><div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" /><span>{useLocale() === 'en' ? 'Secure connection' : useLocale() === 'ps' ? 'خوندي اړیکه' : 'اتصال امن'}</span></div></div></main>;
}
