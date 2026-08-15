'use client';

import * as React from 'react';
import { Truck, Zap, HandCoins } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ShippingMethod } from '@/types';

interface Props {
  methods: ShippingMethod[];
  value?: string;
  onChange: (m: ShippingMethod) => void;
  loading?: boolean;
}

const KIND_ICON = {
  standard: Truck,
  express: Zap,
  cod: HandCoins,
} as const;

/**
 * Presentational shipping-method radio group.
 * Fed by /api/shipping-methods (or a static fallback).
 */
export function ShippingMethodPicker({ methods, value, onChange, loading }: Props) {
  return (
    <section
      aria-label="روش ارسال"
      className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8"
    >
      <header>
        <h2 className="font-display text-xl font-semibold text-navy-800">روش ارسال</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          یکی از روش‌های ارسال زیر را انتخاب کنید.
        </p>
      </header>

      {loading ? (
        <div className="h-24 animate-pulse rounded-xl bg-muted/60" />
      ) : methods.length === 0 ? (
        <p className="text-sm text-muted-foreground">در حال حاضر روش ارسالی موجود نیست.</p>
      ) : (
        <ul className="grid gap-3">
          {methods.map((m) => {
            const Icon = KIND_ICON[m.kind] ?? Truck;
            const active = value === m.id;
            return (
              <li key={m.id}>
                <label
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                    active
                      ? 'border-primary bg-primary/5'
                      : 'border-border/70 hover:border-primary/50',
                  )}
                >
                  <input
                    type="radio"
                    name="shippingMethod"
                    value={m.id}
                    checked={active}
                    onChange={() => onChange(m)}
                    className="mt-1"
                  />
                  <Icon className="mt-0.5 h-5 w-5 text-primary" aria-hidden />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-navy-800">{m.name}</span>
                      <span className="text-sm font-semibold text-navy-800" dir="ltr">
                        {m.cost === 0 ? 'رایگان' : `${m.cost} ${m.currency}`}
                      </span>
                    </div>
                    {m.description ? (
                      <p className="mt-1 text-xs text-muted-foreground">{m.description}</p>
                    ) : null}
                    {typeof m.etaDays === 'number' ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        زمان تخمینی: {m.etaDays} روز
                      </p>
                    ) : null}
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
