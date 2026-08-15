'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Truck, CreditCard, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PaymentMethodValue = 'cod' | 'atoma_pay';

interface PaymentMethodProps {
  value: PaymentMethodValue;
  onChange: (value: PaymentMethodValue) => void;
}

/**
 * Payment-method selector.
 * Phase 1 (payments): COD + ATOMA Pay (online) are both enabled.
 */
export function PaymentMethodPicker({ value, onChange }: PaymentMethodProps) {
  const t = useTranslations('checkout.payment');

  return (
    <section
      aria-label={t('sectionTitle')}
      className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8"
    >
      <header>
        <h2 className="font-display text-xl font-semibold text-navy-800">{t('sectionTitle')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('sectionSubtitle')}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onChange('cod')}
          aria-pressed={value === 'cod'}
          className={cn(
            'group relative flex flex-col items-start gap-2 rounded-xl border p-4 text-start transition',
            value === 'cod'
              ? 'border-gold-500 bg-gold-500/5 ring-2 ring-gold-500/40'
              : 'border-border/70 hover:border-gold-500/50 hover:bg-cream/50',
          )}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-800/5 text-navy-800">
              <Truck className="h-4 w-4" aria-hidden />
            </span>
            <span className="font-medium text-navy-800">{t('cod.title')}</span>
            {value === 'cod' ? (
              <Check className="ms-auto h-4 w-4 text-gold-600" aria-hidden />
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">{t('cod.description')}</p>
        </button>

        <button
          type="button"
          onClick={() => onChange('atoma_pay')}
          aria-pressed={value === 'atoma_pay'}
          className={cn(
            'group relative flex flex-col items-start gap-2 rounded-xl border p-4 text-start transition',
            value === 'atoma_pay'
              ? 'border-gold-500 bg-gold-500/5 ring-2 ring-gold-500/40'
              : 'border-border/70 hover:border-gold-500/50 hover:bg-cream/50',
          )}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-800/5 text-navy-800">
              <CreditCard className="h-4 w-4" aria-hidden />
            </span>
            <span className="font-medium text-navy-800">{t('online.title')}</span>
            {value === 'atoma_pay' ? (
              <Check className="ms-auto h-4 w-4 text-gold-600" aria-hidden />
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">{t('online.description')}</p>
        </button>
      </div>
    </section>
  );
}
