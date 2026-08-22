'use client';

import { useId, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import Link from 'next/link';

type Mode = 'login' | 'register';
type ApiUser = { id: string; fullName?: string | null; email?: string | null; phone?: string | null; role?: 'user' | 'customer' | 'seller' | 'admin' };
type ApiResult = { ok: boolean; user?: ApiUser; error?: { code?: string; message?: string } };

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('authForm');
  const searchParams = useSearchParams();
  const uid = useId();
  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const mismatch = mode === 'register' && confirmPassword.length > 0 && confirmPassword !== password;

  function validateIdentifier(value: string) {
    const normalized = value.trim();
    if (!normalized) return t('identifier');
    if (normalized.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? null : t('invalidEmail');
    return /^[+0-9\s()\-]{8,20}$/.test(normalized) ? null : t('invalidPhone');
  }

  function safeRedirect() {
    const requested = searchParams.get('redirect');
    return requested?.startsWith('/') && !requested.startsWith('//') ? requested : '/';
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const identifierError = validateIdentifier(identifier);
    if (identifierError) { setError(identifierError); return; }
    if (mode === 'register') {
      if (fullName.trim().length < 2) { setError(t('requiredName')); return; }
      if (password.length < 8) { setError(t('passwordMin')); return; }
      if (mismatch || password !== confirmPassword) { setError(t('mismatch')); return; }
    } else if (!password) { setError(t('requiredPassword')); return; }

    setLoading(true);
    try {
      const response = await fetch(mode === 'register' ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(mode === 'register'
          ? { fullName: fullName.trim(), identifier: identifier.trim(), password, confirmPassword }
          : { identifier: identifier.trim(), password }),
      });
      const data = await response.json() as ApiResult;
      if (!response.ok || !data.ok) {
        const code = data.error?.code ?? '';
        const messages: Record<string, string> = {
          INVALID_CREDENTIALS: t('invalidCredentials'),
          USER_EXISTS: t('userExists'),
          TOO_MANY_REQUESTS: t('tooManyRequests'),
          VALIDATION_ERROR: t('validationError'),
          service_unavailable: t('serviceUnavailable'),
        };
        setError(messages[code] ?? t('unknown'));
        return;
      }

      setSuccess(true);
      const requested = safeRedirect();
      const destination = requested !== '/'
        ? requested
        : data.user?.role === 'admin'
          ? '/admin'
          : data.user?.role === 'seller'
            ? '/seller'
            : mode === 'register'
              ? '/profile'
              : '/';
      router.replace(destination);
      router.refresh();
    } catch {
      setError(t('connection'));
    } finally {
      setLoading(false);
    }
  }

  if (success) return <div className="flex flex-col items-center gap-3 py-6 text-center" role="status" aria-live="polite"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10"><CheckCircle2 className="h-7 w-7 text-primary" aria-hidden="true" /></div><p className="font-semibold">{mode === 'register' ? t('successRegister') : t('successLogin')}</p><p className="text-sm text-muted-foreground">{t('redirecting')}</p></div>;

  return <form onSubmit={onSubmit} className="space-y-4" noValidate aria-label={mode === 'login' ? t('login') : t('register')}>
    {mode === 'register' && <div className="space-y-1.5"><Label htmlFor={`${uid}-name`}>{t('name')}</Label><div className="relative"><User className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id={`${uid}-name`} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" required maxLength={80} placeholder={t('namePlaceholder')} className="h-11 rounded-xl ps-10" /></div></div>}
    <div className="space-y-1.5"><Label htmlFor={`${uid}-identifier`}>{t('identifier')}</Label><div className="relative"><Mail className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id={`${uid}-identifier`} value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" inputMode="email" required maxLength={120} dir="ltr" placeholder={t('identifierPlaceholder')} className="h-11 rounded-xl ps-10" /></div></div>
    <div className="space-y-1.5"><div className="flex items-center justify-between"><Label htmlFor={`${uid}-password`}>{t('password')}</Label>{mode === 'login' && <Link href={`/${locale}/auth/forgot-password`} className="text-xs text-primary hover:underline">{t('forgot')}</Link>}</div><div className="relative"><Lock className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id={`${uid}-password`} type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={mode === 'register' ? 8 : undefined} maxLength={128} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder={t('passwordPlaceholder')} className="h-11 rounded-xl ps-10 pe-11" dir="ltr" /><button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute end-3 top-1/2 -translate-y-1/2 rounded p-1" aria-label={showPassword ? t('hide') : t('show')}>{showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}</button></div></div>
    {mode === 'register' && <div className="space-y-1.5"><Label htmlFor={`${uid}-confirm`}>{t('confirm')}</Label><div className="relative"><Lock className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id={`${uid}-confirm`} type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} maxLength={128} aria-invalid={mismatch} placeholder={t('confirmPlaceholder')} className="h-11 rounded-xl ps-10 pe-11" dir="ltr" /><button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute end-3 top-1/2 -translate-y-1/2 rounded p-1" aria-label={showConfirm ? t('hide') : t('show')}>{showConfirm ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}</button></div>{mismatch && <p className="text-xs text-destructive" role="alert">{t('mismatch')}</p>}</div>}
    {error && <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3.5 py-3 text-sm text-destructive" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{error}</div>}
    <Button type="submit" disabled={loading || mismatch} className="h-11 w-full rounded-xl font-semibold">{loading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{t('loading')}</> : mode === 'register' ? t('register') : t('login')}</Button>
    <p className="text-center text-sm text-muted-foreground">{mode === 'register' ? t('haveAccount') : t('noAccount')} <Link href={`/${locale}/auth/${mode === 'register' ? 'login' : 'register'}`} className="font-semibold text-primary hover:underline">{mode === 'register' ? t('signIn') : t('signUp')}</Link></p>
  </form>;
}
