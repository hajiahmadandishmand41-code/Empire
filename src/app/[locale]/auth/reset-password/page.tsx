'use client';

import { useState, type FormEvent, useId, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Eye, EyeOff, Loader2, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { EmpireLogo } from '@/components/empire-logo';

function ResetPasswordForm() {
  const router = useRouter();
  const locale = useLocale();
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

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) { setError('رمزها یکسان نیستند'); return; }
    if (!token) { setError('توکن نامعتبر است'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
        credentials: 'same-origin',
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { setError(data?.error?.message ?? 'خطایی رخ داد'); return; }
      setSuccess(true);
      setTimeout(() => router.push(`/${locale}/auth/login`), 2000);
    } catch {
      setError('اتصال به سرور ممکن نیست');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50">
          <Lock className="h-6 w-6 text-rose-600" />
        </div>
        <h1 className="text-lg font-extrabold text-foreground">بازنشانی رمز عبور</h1>
        <p className="mt-1 text-sm text-muted-foreground">رمز عبور جدید خود را وارد کنید</p>
      </div>

      {success ? (
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div className="text-start">
              <p className="font-bold">رمز عبور تغییر کرد</p>
              <p className="text-xs text-emerald-600 mt-0.5">در حال انتقال به صفحه ورود...</p>
            </div>
          </div>
          <Link href={`/${locale}/auth/login`} className="block text-sm font-bold text-rose-600 hover:text-rose-700">ورود به حساب</Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor={`${uid}-pw`} className="text-xs font-semibold text-foreground">رمز عبور جدید</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id={`${uid}-pw`} type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="حداقل ۸ کاراکتر" className="ps-9 pe-10 h-10 text-sm border-border" dir="ltr" />
              <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${uid}-confirm`} className="text-xs font-semibold text-foreground">تکرار رمز عبور جدید</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id={`${uid}-confirm`} type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="تکرار رمز عبور" className={cn('ps-9 pe-10 h-10 text-sm', passwordMismatch ? 'border-red-300' : 'border-border')} dir="ltr" />
              <button type="button" tabIndex={-1} onClick={() => setShowConfirm(!showConfirm)} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passwordMismatch && <p className="text-xs text-red-500">رمزها یکسان نیستند</p>}
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
          <Button type="submit" disabled={loading || passwordMismatch} className="w-full h-10 rounded-xl bg-rose-600 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'بازنشانی رمز عبور'}
          </Button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  const locale = useLocale();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border px-4 py-3">
        <div className="mx-auto max-w-screen-xl">
          <Link href={`/${locale}`} className="flex items-center gap-2.5 w-fit">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-600">
              <EmpireLogo size={24} variant="color" />
            </div>
            <span className="font-display text-sm font-extrabold text-foreground">EmpireShop</span>
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Suspense fallback={<div className="text-center text-sm text-muted-foreground">در حال بارگذاری...</div>}>
            <ResetPasswordForm />
          </Suspense>
          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>اتصال امن</span>
          </div>
        </div>
      </main>
    </div>
  );
}
