'use client';

import * as React from 'react';
import { MapPin, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ShippingAddress } from '@/types';

interface Props {
  addresses: ShippingAddress[];
  value: string | null; // addressId or null == "new"
  onChange: (id: string | null) => void;
  loading?: boolean;
}

/**
 * Lets a signed-in user pick one of their saved addresses,
 * or fall back to entering a new one.
 */
export function SavedAddressPicker({ addresses, value, onChange, loading }: Props) {
  if (loading) return <div className="h-16 animate-pulse rounded-xl bg-muted/50" />;
  if (addresses.length === 0) return null;

  return (
    <section
      aria-label="آدرس‌های ذخیره‌شده"
      className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8"
    >
      <header>
        <h2 className="font-display text-xl font-semibold text-navy-800">آدرس تحویل</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          یکی از آدرس‌های ذخیره‌شده را انتخاب یا آدرس جدیدی وارد کنید.
        </p>
      </header>

      <ul className="grid gap-2">
        {addresses.map((a) => {
          const active = value === a.id;
          return (
            <li key={a.id}>
              <label
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors',
                  active ? 'border-primary bg-primary/5' : 'border-border/70 hover:border-primary/50',
                )}
              >
                <input
                  type="radio"
                  name="savedAddress"
                  checked={active}
                  onChange={() => onChange(a.id ?? null)}
                  className="mt-1"
                />
                <MapPin className="mt-0.5 h-5 w-5 text-primary" aria-hidden />
                <div className="flex flex-1 flex-col text-sm">
                  <span className="font-medium text-navy-800">
                    {a.label ?? a.fullName}
                    {a.isDefault ? (
                      <span className="me-2 rounded-full bg-gold-500/20 px-2 py-0.5 text-xs text-navy-800">
                        پیش‌فرض
                      </span>
                    ) : null}
                  </span>
                  <span className="text-muted-foreground">
                    {a.province} — {a.district}
                    {a.city ? ` — ${a.city}` : ''}
                  </span>
                  <span className="text-muted-foreground">{a.addressLine}</span>
                  <span dir="ltr" className="text-muted-foreground">{a.phone}</span>
                </div>
              </label>
            </li>
          );
        })}

        <li>
          <label
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors',
              value === null ? 'border-primary bg-primary/5' : 'border-border/70 hover:border-primary/50',
            )}
          >
            <input
              type="radio"
              name="savedAddress"
              checked={value === null}
              onChange={() => onChange(null)}
            />
            <Plus className="h-4 w-4 text-primary" aria-hidden />
            <span className="text-sm font-medium">افزودن آدرس جدید</span>
          </label>
        </li>
      </ul>
    </section>
  );
}
