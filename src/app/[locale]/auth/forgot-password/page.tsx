'use client';

import { useState, type FormEvent, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, CheckCircle2, Mail, ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { EmpireLogo } from '@/components/empire-logo';

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const uid = useId();
  const t = useTranslations('auth.forgotPassword');
  const tErr = useTranslations('auth.errors');
  const tAuth = useTranslations('auth');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
        credentials: 'same-origin',
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error?.message ?? tErr('unknown'));
        return;
      }
      setSent(true);
    } catch {
      setError(tErr('connectionError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border px-4 py-3">
        <div className="mx-auto max-w-screen-xl flex items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-600">
              <EmpireLogo size={24} variant="color" />
            </div>
            <span className="font-display text-sm font-extrabold text-foreground">EmpireShop</span>
          </Link>
          <Link href={`/${locale}/auth/login`} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-rose-600 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
            {tAuth('backToLogin')}
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/30">
                <Mail className="h-6 w-6 text-amber-600 dark:text-amber-400" aria-hidden />
              </div>
              <h1 className="text-lg font-extrabold text-foreground">{t('title')}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
            </div>

            {sent ? (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-100 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-4 text-sm text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <div className="text-start">
                    <p className="font-bold">{t('sent.title')}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">{t('sent.subtitle')}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{t('sent.spamNote')}</p>
                <Link href={`/${locale}/auth/login`} className="block text-sm font-bold text-rose-600 hover:text-rose-700 dark:hover:text-rose-400">
                  {tAuth('backToLogin')}
                </Link>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor={`${uid}-email`} className="text-xs font-semibold text-foreground">آدرس ایمیل</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id={`${uid}-email`} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="example@email.com" className="ps-9 h-10 text-sm" dir="ltr" />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-3 py-2.5 text-xs text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full h-10 rounded-xl bg-rose-600 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('submit')}
                </Button>

                <div className="text-center">
                  <Link href={`/${locale}/auth/login`} className="text-xs text-muted-foreground hover:text-rose-600">
                    {tAuth('backToLogin')}
                  </Link>
                </div>
              </form>
            )}
          </div>
          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>اتصال امن</span>
          </div>
        </div>
      </main>
    </div>
  );
}
