'use client';

import { useId, useState, type FormEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

function ResetPasswordForm() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('resetPassword');
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
  const mismatch = confirmPassword.length > 0 && confirmPassword !== password;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!token) { setError(t('invalid')); return; }
    if (password.length < 8) { setError(t('hint')); return; }
    if (password !== confirmPassword) { setError(t('mismatch')); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ token, password, confirmPassword }) });
      const data = await response.json() as { ok?: boolean; error?: { message?: string } };
      if (!response.ok || !data.ok) { setError(t('error')); return; }
      setSuccess(true);
      window.setTimeout(() => router.push(`/${locale}/auth/login`), 1800);
    } catch {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  }

  return <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8" aria-labelledby="reset-password-title">
    <div className="mb-6 text-center"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10" aria-hidden="true"><Lock className="h-6 w-6 text-primary" /></div><h1 id="reset-password-title" className="text-xl font-extrabold">{t('title')}</h1><p className="mt-1.5 text-sm text-muted-foreground">{t('subtitle')}</p></div>
    {success ? <div className="space-y-4 text-center" role="status" aria-live="polite"><div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200/60 bg-emerald-50/70 px-4 py-4 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400"><CheckCircle2 className="h-5 w-5" aria-hidden="true" /><span className="font-semibold">{t('success')}</span></div><p className="text-xs text-muted-foreground">{t('redirecting')}</p><Link href={`/${locale}/auth/login`} className="text-sm font-semibold text-primary hover:underline">{t('back')}</Link></div> : <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5"><Label htmlFor={`${uid}-pw`}>{t('password')}</Label><div className="relative"><Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id={`${uid}-pw`} type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} maxLength={128} placeholder={t('hint')} className="h-11 rounded-xl ps-9 pe-11" dir="ltr" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute end-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground" aria-label={showPassword ? t('hide') : t('show')}>{showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}</button></div></div>
      <div className="space-y-1.5"><Label htmlFor={`${uid}-confirm`}>{t('confirm')}</Label><div className="relative"><Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id={`${uid}-confirm`} type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} maxLength={128} aria-invalid={mismatch} className={cn('h-11 rounded-xl ps-9 pe-11', mismatch && 'border-destructive')} placeholder={t('confirm')} dir="ltr" /><button type="button" onClick={() => setShowConfirm((value) => !value)} className="absolute end-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground" aria-label={showConfirm ? t('hide') : t('show')}>{showConfirm ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}</button></div>{mismatch && <p className="text-xs text-destructive" role="alert">{t('mismatch')}</p>}</div>
      {error && <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3.5 py-3 text-sm text-destructive" role="alert" aria-live="polite"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{error}</div>}
      <Button type="submit" disabled={loading || mismatch} className="h-11 w-full rounded-xl font-semibold">{loading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{t('loading')}</> : t('submit')}</Button>
      <div className="text-center"><Link href={`/${locale}/auth/login`} className="text-xs text-muted-foreground hover:text-primary hover:underline">{t('back')}</Link></div>
    </form>}
  </section>;
}

export default function ResetPasswordPage() {
  const t = useTranslations('resetPassword');
  return <main id="main" className="flex min-h-[calc(100dvh-8rem)] items-center justify-center px-4 py-8 sm:py-12"><div className="w-full max-w-md"><Suspense fallback={<div className="py-16 text-center text-sm text-muted-foreground">{t('loadingPage')}</div>}><ResetPasswordForm /></Suspense><div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" /><span>{t('secure')}</span></div></div></main>;
}
