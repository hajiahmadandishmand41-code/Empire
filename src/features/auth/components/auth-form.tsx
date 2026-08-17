'use client';

import { useState, type FormEvent, useId } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type Mode = 'login' | 'register';

interface Props {
  mode: Mode;
}

interface ApiFailure {
  ok: false;
  error: { code: string; message: string };
}

const copy = {
  fa: { name: 'نام و نام خانوادگی', identifier: 'ایمیل یا شماره موبایل', password: 'رمز عبور', confirm: 'تکرار رمز عبور', namePlaceholder: 'مثلاً احمد کریمی', identifierPlaceholder: 'example@email.com یا 0700000000', loginPasswordPlaceholder: 'رمز عبور خود را وارد کنید', registerPasswordPlaceholder: 'حداقل ۸ کاراکتر', forgot: 'فراموشی رمز عبور؟', login: 'ورود به حساب', register: 'ایجاد حساب کاربری', loading: 'در حال ارسال…', noAccount: 'حساب ندارید؟', haveAccount: 'قبلاً ثبت‌نام کرده‌اید؟', signUp: 'ثبت‌نام کنید', signIn: 'وارد شوید', mismatch: 'رمز عبور و تکرار آن یکسان نیستند', connection: 'خطای ارتباط با سرور — اتصال اینترنت خود را بررسی کنید', unknown: 'خطایی رخ داد، لطفاً دوباره تلاش کنید', successLogin: 'ورود موفق!', successRegister: 'حساب کاربری ایجاد شد!', redirecting: 'در حال انتقال…', show: 'نمایش رمز', hide: 'مخفی کردن رمز', strength: ['','ضعیف','متوسط','خوب','قوی','عالی'], strengthLabel: 'قدرت رمز' },
  ps: { name: 'بشپړ نوم', identifier: 'برېښنالیک یا موبایل شمېره', password: 'پټنوم', confirm: 'د پټنوم بیا تکرار', namePlaceholder: 'لکه احمد کریمي', identifierPlaceholder: 'example@email.com یا 0700000000', loginPasswordPlaceholder: 'خپل پټنوم دننه کړئ', registerPasswordPlaceholder: 'لږ تر لږه ۸ توري', forgot: 'پټنوم مو هېر شوی؟', login: 'حساب ته ننوتل', register: 'حساب جوړول', loading: 'لېږل کېږي…', noAccount: 'حساب نه لرئ؟', haveAccount: 'مخکې مو ثبت‌نام کړی؟', signUp: 'ثبت‌نام وکړئ', signIn: 'ننوزئ', mismatch: 'پټنومونه یو شان نه دي', connection: 'له سرور سره اړیکه ونښلېده', unknown: 'ستونزه رامنځته شوه، بیا هڅه وکړئ', successLogin: 'بریالی ننوتل!', successRegister: 'حساب جوړ شو!', redirecting: 'لېږدول کېږي…', show: 'پټنوم ښکاره کړئ', hide: 'پټنوم پټ کړئ', strength: ['','کمزوری','منځنی','ښه','قوي','ډېر قوي'], strengthLabel: 'د پټنوم ځواک' },
  en: { name: 'Full name', identifier: 'Email or phone number', password: 'Password', confirm: 'Confirm password', namePlaceholder: 'e.g. Ahmad Karimi', identifierPlaceholder: 'name@example.com or 0700000000', loginPasswordPlaceholder: 'Enter your password', registerPasswordPlaceholder: 'At least 8 characters', forgot: 'Forgot password?', login: 'Sign in', register: 'Create account', loading: 'Submitting…', noAccount: "Don't have an account?", haveAccount: 'Already registered?', signUp: 'Create an account', signIn: 'Sign in', mismatch: 'Passwords do not match', connection: "We couldn't connect to the server. Check your internet connection.", unknown: 'Something went wrong. Please try again.', successLogin: 'Signed in successfully!', successRegister: 'Account created successfully!', redirecting: 'Redirecting…', show: 'Show password', hide: 'Hide password', strength: ['','Weak','Fair','Good','Strong','Excellent'], strengthLabel: 'Password strength' },
} as const;

export function AuthForm({ mode }: Props) {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const uid = useId();
  const language = locale === 'en' || locale === 'ps' ? locale : 'fa';
  const t = copy[language];

  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  const passwordMismatch = mode === 'register' && confirmPassword.length > 0 && confirmPassword !== password;
  const pwColors = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500', 'bg-emerald-500'];

  function getSafeRedirect() {
    const requested = searchParams.get('redirect');
    return requested && requested.startsWith('/') && !requested.startsWith('//') ? requested : '/';
  }

  function validateIdentifier(value: string) {
    const normalized = value.trim();
    if (!normalized) return t.identifier;
    if (normalized.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? null : (language === 'en' ? 'Enter a valid email address.' : language === 'ps' ? 'د سم برېښنالیک پته دننه کړئ.' : 'ایمیل معتبر وارد کنید.');
    return /^[+0-9\s()\-]{8,20}$/.test(normalized) ? null : (language === 'en' ? 'Enter a valid phone number.' : language === 'ps' ? 'د تلیفون سمه شمېره دننه کړئ.' : 'شماره تلفن معتبر وارد کنید.');
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const identifierError = validateIdentifier(identifier);
    if (identifierError) { setError(identifierError); return; }
    if (mode === 'register') {
      if (fullName.trim().length < 2) { setError(language === 'en' ? 'Enter your full name.' : language === 'ps' ? 'خپل بشپړ نوم دننه کړئ.' : 'نام کامل خود را وارد کنید.'); return; }
      if (password.length < 8) { setError(language === 'en' ? 'Password must be at least 8 characters.' : language === 'ps' ? 'پټنوم باید لږ تر لږه ۸ توري ولري.' : 'رمز عبور باید حداقل ۸ کاراکتر باشد.'); return; }
      if (password !== confirmPassword) { setError(t.mismatch); return; }
    } else if (!password) {
      setError(language === 'en' ? 'Enter your password.' : language === 'ps' ? 'خپل پټنوم دننه کړئ.' : 'رمز عبور را وارد کنید.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(mode === 'register' ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(mode === 'register' ? { fullName: fullName.trim(), identifier: identifier.trim(), password, confirmPassword } : { identifier: identifier.trim(), password }),
      });
      const data = (await response.json()) as ApiFailure | { ok: true };
      if (!response.ok || !data.ok) {
        const code = (data as ApiFailure)?.error?.code ?? '';
        const mapped: Record<string, string> = {
          INVALID_CREDENTIALS: language === 'en' ? 'The email/phone or password is incorrect.' : language === 'ps' ? 'برېښنالیک/شمېره یا پټنوم سم نه دی.' : 'ایمیل/شماره یا رمز عبور اشتباه است.',
          USER_EXISTS: language === 'en' ? 'An account with this email or phone already exists.' : language === 'ps' ? 'له دې برېښنالیک یا شمېرې سره حساب مخکې شته.' : 'این ایمیل یا شماره قبلاً ثبت شده است.',
          TOO_MANY_REQUESTS: language === 'en' ? 'Too many attempts. Please try again later.' : language === 'ps' ? 'هڅې ډېرې شوې؛ وروسته بیا هڅه وکړئ.' : 'تعداد تلاش زیاد است؛ بعداً دوباره تلاش کنید.',
          VALIDATION_ERROR: language === 'en' ? 'Please check the information you entered.' : language === 'ps' ? 'مهرباني وکړئ خپل معلومات وڅېړئ.' : 'اطلاعات واردشده را بررسی کنید.',
          ACCOUNT_DISABLED: language === 'en' ? 'This account is disabled. Please contact support.' : language === 'ps' ? 'دا حساب غیر فعال دی؛ له ملاتړ سره اړیکه ونیسئ.' : 'این حساب غیرفعال است؛ با پشتیبانی تماس بگیرید.',
          service_unavailable: language === 'en' ? 'Authentication is temporarily unavailable. Please try again later.' : language === 'ps' ? 'د ننوتلو خدمت لنډ مهال شتون نه لري.' : 'سرویس ورود موقتاً در دسترس نیست. بعداً دوباره تلاش کنید.',
        };
        setError(mapped[code] ?? t.unknown);
        return;
      }
      setSuccess(true);
      router.replace(getSafeRedirect());
      router.refresh();
    } catch {
      setError(t.connection);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return <div className="flex flex-col items-center gap-3 py-6 text-center" role="status" aria-live="polite"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/10"><CheckCircle2 className="h-7 w-7 text-primary" /></div><p className="font-semibold text-foreground">{mode === 'register' ? t.successRegister : t.successLogin}</p><p className="text-sm text-muted-foreground">{t.redirecting}</p></div>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate aria-label={mode === 'login' ? t.login : t.register}>
      {mode === 'register' && <div className="space-y-1.5"><Label htmlFor={`${uid}-name`} className="text-sm font-medium">{t.name} <span className="text-destructive" aria-hidden="true">*</span></Label><div className="relative"><User className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id={`${uid}-name`} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" required maxLength={80} placeholder={t.namePlaceholder} className="h-11 rounded-xl ps-10" /></div></div>}
      <div className="space-y-1.5"><Label htmlFor={`${uid}-identifier`} className="text-sm font-medium">{t.identifier} <span className="text-destructive" aria-hidden="true">*</span></Label><div className="relative"><Mail className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id={`${uid}-identifier`} value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" inputMode="email" required maxLength={120} dir="ltr" placeholder={t.identifierPlaceholder} className="h-11 rounded-xl ps-10" /></div></div>
      <div className="space-y-1.5"><div className="flex items-center justify-between"><Label htmlFor={`${uid}-password`} className="text-sm font-medium">{t.password} <span className="text-destructive" aria-hidden="true">*</span></Label>{mode === 'login' && <Link href={`/${locale}/auth/forgot-password`} className="text-xs text-primary hover:underline">{t.forgot}</Link>}</div><div className="relative"><Lock className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id={`${uid}-password`} type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={mode === 'register' ? 8 : undefined} maxLength={128} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder={mode === 'register' ? t.registerPasswordPlaceholder : t.loginPasswordPlaceholder} dir="ltr" className="h-11 rounded-xl ps-10 pe-11" /><button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute end-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground" aria-label={showPassword ? t.hide : t.show}>{showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}</button></div>{mode === 'register' && password && <div className="space-y-1.5" aria-label={`${t.strengthLabel}: ${t.strength[pwStrength]}`}><div className="flex gap-1" aria-hidden="true">{[1,2,3,4,5].map((level) => <span key={level} className={cn('h-1 flex-1 rounded-full', level <= pwStrength ? pwColors[pwStrength] : 'bg-muted')} />)}</div><p className="text-[11px] text-muted-foreground">{t.strengthLabel}: {t.strength[pwStrength]}</p></div>}</div></div>
      {mode === 'register' && <div className="space-y-1.5"><Label htmlFor={`${uid}-confirm`} className="text-sm font-medium">{t.confirm} <span className="text-destructive" aria-hidden="true">*</span></Label><div className="relative"><Lock className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id={`${uid}-confirm`} type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} maxLength={128} autoComplete="new-password" aria-invalid={passwordMismatch} aria-describedby={passwordMismatch ? `${uid}-mismatch` : undefined} placeholder={t.confirm} dir="ltr" className="h-11 rounded-xl ps-10 pe-11" /><button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute end-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground" aria-label={showConfirm ? t.hide : t.show}>{showConfirm ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}</button></div>{passwordMismatch && <p id={`${uid}-mismatch`} role="alert" className="text-xs text-destructive">{t.mismatch}</p>}</div>}
      {error && <div role="alert" aria-live="polite" className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 px-3.5 py-3 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>{error}</span></div>}
      <Button type="submit" disabled={loading || passwordMismatch} size="lg" className="h-11 w-full rounded-xl font-semibold">{loading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{t.loading}</> : mode === 'register' ? t.register : t.login}</Button>
      <p className="text-center text-xs text-muted-foreground">{mode === 'login' ? <>{t.noAccount}{' '}<Link href={`/${locale}/auth/register`} className="font-semibold text-primary hover:underline">{t.signUp}</Link></> : <>{t.haveAccount}{' '}<Link href={`/${locale}/auth/login`} className="font-semibold text-primary hover:underline">{t.signIn}</Link></>}</p>
    </form>
  );
}
