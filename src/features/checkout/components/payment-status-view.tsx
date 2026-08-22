'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/features/cart';

interface PaymentStatusViewProps {
  locale: string;
  reference: string;
}

interface VerifyResponse {
  ok: boolean;
  data?: {
    status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
    method: string;
    amount: number;
    currency: string;
    order?: { reference: string; status: string; paymentStatus: string } | null;
  };
  error?: { message?: string };
}

type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
const TERMINAL: readonly PaymentStatus[] = ['paid', 'failed', 'refunded', 'cancelled'];

export function PaymentStatusView({ locale: _locale, reference }: PaymentStatusViewProps) {
  const t = useTranslations('payment');
  const clear = useCartStore((state) => state.clear);
  const [state, setState] = React.useState<VerifyResponse['data'] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const poll = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/payments/verify?reference=${encodeURIComponent(reference)}`, { cache: 'no-store' });
      const json = (await res.json()) as VerifyResponse;
      if (!json.ok) {
        setError(json.error?.message ?? 'verify failed');
        return null;
      }
      setState(json.data ?? null);
      setError(null);
      return json.data ?? null;
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  }, [reference]);

  React.useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;

    const tick = async () => {
      if (cancelled) return;
      const data = await poll();
      attempts += 1;
      if (cancelled || (data && TERMINAL.includes(data.status)) || attempts >= 40) return;
      timer = setTimeout(() => void tick(), 3000);
    };

    void tick();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [poll]);

  React.useEffect(() => {
    if (state?.status === 'paid') clear();
  }, [clear, state?.status]);

  const status = state?.status ?? 'pending';

  return (
    <section
      aria-live="polite"
      aria-busy={status === 'pending'}
      className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 rounded-3xl border border-border/70 bg-card p-6 text-center shadow-sm sm:p-10 lg:p-12"
    >
      <StatusIcon status={status} />
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">{t(`status.${status}.title`)}</h1>
        <p className="text-sm leading-6 text-muted-foreground sm:text-base">{t(`status.${status}.description`)}</p>
        <p className="break-all text-xs text-muted-foreground">{t('reference')}: <span className="font-mono font-medium">{reference}</span></p>
      </div>

      {status === 'pending' && !error ? (
        <div className="flex items-center gap-2 rounded-full bg-muted/60 px-4 py-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          <span>{t(`status.${status}.description`)}</span>
        </div>
      ) : null}

      {error ? <p role="alert" className="w-full rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}

      <div className="flex w-full flex-col justify-center gap-3 sm:flex-row">
        {status === 'paid' ? (
          <Button asChild variant="gold" size="lg" className="w-full sm:w-auto"><Link href="/order/success">{t('actions.viewOrder')}</Link></Button>
        ) : null}
        {status === 'failed' || status === 'cancelled' ? (
          <Button asChild variant="gold" size="lg" className="w-full sm:w-auto"><Link href="/checkout">{t('actions.retry')}</Link></Button>
        ) : null}
        <Button asChild variant="outline" size="lg" className="w-full sm:w-auto"><Link href="/shop">{t('actions.backToShop')}</Link></Button>
      </div>
    </section>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'paid') {
    return <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600" aria-hidden="true"><CheckCircle2 className="h-8 w-8" /></span>;
  }
  if (status === 'failed' || status === 'cancelled') {
    return <span className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive" aria-hidden="true"><XCircle className="h-8 w-8" /></span>;
  }
  return <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-500/10 text-gold-600" aria-hidden="true"><Clock className="h-8 w-8 animate-pulse" /></span>;
}
