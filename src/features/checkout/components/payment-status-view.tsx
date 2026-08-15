'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';

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
  const [state, setState] = React.useState<VerifyResponse['data'] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [retrying, setRetrying] = React.useState(false);

  const poll = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/payments/verify?reference=${encodeURIComponent(reference)}`, {
        cache: 'no-store',
      });
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
    let attempts = 0;
    const tick = async () => {
      if (cancelled) return;
      const data = await poll();
      attempts += 1;
      if (data && TERMINAL.includes(data.status)) return;
      if (attempts >= 40) return; // ~2 minutes at 3s
      setTimeout(tick, 3000);
    };
    void tick();
    return () => {
      cancelled = true;
    };
  }, [poll]);

  async function retry() {
    setRetrying(true);
    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderReference: reference }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        data?: { redirectUrl?: string };
      };
      if (json.ok && json.data?.redirectUrl) {
        window.location.href = json.data.redirectUrl;
      }
    } finally {
      setRetrying(false);
    }
  }

  const status = state?.status ?? 'pending';

  return (
    <section
      aria-live="polite"
      className="flex flex-col items-center gap-6 rounded-3xl border border-border/70 bg-card p-8 text-center shadow-sm sm:p-12"
    >
      <StatusIcon status={status} />
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-navy-800 sm:text-3xl">
          {t(`status.${status}.title`)}
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          {t(`status.${status}.description`)}
        </p>
        <p className="text-xs text-muted-foreground">
          {t('reference')}: <span className="font-mono">{reference}</span>
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-center gap-3">
        {status === 'paid' ? (
          <Button asChild variant="gold" size="lg">
            <Link href="/order/success">{t('actions.viewOrder')}</Link>
          </Button>
        ) : null}
        {status === 'failed' || status === 'cancelled' ? (
          <Button variant="gold" size="lg" onClick={retry} disabled={retrying}>
            {retrying ? <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden /> : null}
            {t('actions.retry')}
          </Button>
        ) : null}
        <Button asChild variant="outline" size="lg">
          <Link href="/shop">{t('actions.backToShop')}</Link>
        </Button>
      </div>
    </section>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'paid') {
    return (
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <CheckCircle2 className="h-8 w-8" aria-hidden />
      </span>
    );
  }
  if (status === 'failed' || status === 'cancelled') {
    return (
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <XCircle className="h-8 w-8" aria-hidden />
      </span>
    );
  }
  return (
    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-500/10 text-gold-600">
      <Clock className="h-8 w-8 animate-pulse" aria-hidden />
    </span>
  );
}
