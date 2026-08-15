'use client';

import * as React from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AFGHAN_PROVINCES, AFGHAN_PROVINCES_DARI, type AfghanProvince } from '@/lib/afghanistan/provinces';
import { cn } from '@/lib/utils';
import type { CheckoutFormState } from '../types';
import type { CheckoutErrors } from '../validation';

interface CheckoutFormProps {
  values: CheckoutFormState;
  errors: CheckoutErrors;
  touched: Record<string, boolean>;
  onChange: <K extends keyof CheckoutFormState>(key: K, value: string) => void;
  onBlur: (key: keyof CheckoutFormState) => void;
}

export function CheckoutForm({ values, errors, touched, onChange, onBlur }: CheckoutFormProps) {
  const t = useTranslations('checkout.form');
  const tv = useTranslations('validation');
  const locale = useLocale();

  const showDari = locale === 'fa' || locale === 'ps';

  const err = (key: keyof CheckoutFormState) =>
    touched[key] && errors[key as keyof CheckoutErrors]
      ? tv(errors[key as keyof CheckoutErrors] as string)
      : undefined;

  return (
    <section
      aria-label={t('sectionTitle')}
      className="rounded-2xl border border-border bg-card shadow-sm p-5 sm:p-6"
    >
      <header className="mb-5 border-b border-border pb-4">
        <h2 className="text-base font-semibold text-foreground">{t('sectionTitle')}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t('sectionSubtitle')}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="fullName" label={t('fullName')} error={err('fullName')} required>
          <Input
            id="fullName"
            value={values.fullName}
            onChange={(e) => onChange('fullName', e.target.value)}
            onBlur={() => onBlur('fullName')}
            placeholder={t('fullNamePlaceholder')}
            autoComplete="name"
            aria-invalid={!!err('fullName')}
            className={cn(
              'h-10 rounded-xl border-border bg-background text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-400/15',
              err('fullName') && 'border-red-300 focus:border-red-400 focus:ring-red-400/15'
            )}
          />
        </Field>

        <Field id="phone" label={t('phone')} error={err('phone')} required>
          <Input
            id="phone"
            value={values.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            onBlur={() => onBlur('phone')}
            placeholder={t('phonePlaceholder')}
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            aria-invalid={!!err('phone')}
            className={cn(
              'h-10 rounded-xl border-border bg-background text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-400/15',
              err('phone') && 'border-red-300 focus:border-red-400 focus:ring-red-400/15'
            )}
          />
        </Field>

        <Field id="email" label={t('email')} error={undefined}>
          <Input
            id="email"
            type="email"
            value={values.email}
            onChange={(e) => onChange('email', e.target.value)}
            onBlur={() => onBlur('email')}
            placeholder={t('emailPlaceholder')}
            autoComplete="email"
            dir="ltr"
            className="h-10 rounded-xl border-border bg-background text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-400/15"
          />
        </Field>

        <Field id="province" label={t('province')} error={err('province')} required>
          <select
            id="province"
            value={values.province}
            onChange={(e) => onChange('province', e.target.value)}
            onBlur={() => onBlur('province')}
            aria-invalid={!!err('province')}
            className={cn(
              'h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground',
              'focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/15',
              err('province') && 'border-red-300 focus:border-red-400 focus:ring-red-400/15',
            )}
          >
            <option value="">{t('provincePlaceholder')}</option>
            {AFGHAN_PROVINCES.map((p) => (
              <option key={p} value={p}>
                {showDari ? AFGHAN_PROVINCES_DARI[p as AfghanProvince] ?? p : p}
              </option>
            ))}
          </select>
        </Field>

        <Field id="district" label={t('district')} error={err('district')} required>
          <Input
            id="district"
            value={values.district}
            onChange={(e) => onChange('district', e.target.value)}
            onBlur={() => onBlur('district')}
            placeholder={t('districtPlaceholder')}
            aria-invalid={!!err('district')}
            className={cn(
              'h-10 rounded-xl border-border bg-background text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-400/15',
              err('district') && 'border-red-300 focus:border-red-400 focus:ring-red-400/15'
            )}
          />
        </Field>

        <Field id="city" label={t('city')} error={undefined}>
          <Input
            id="city"
            value={values.city}
            onChange={(e) => onChange('city', e.target.value)}
            placeholder={t('cityPlaceholder')}
            autoComplete="address-level2"
            className="h-10 rounded-xl border-border bg-background text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-400/15"
          />
        </Field>

        <Field
          id="addressLine"
          label={t('addressLine')}
          error={err('addressLine')}
          required
          className="sm:col-span-2"
        >
          <Input
            id="addressLine"
            value={values.addressLine}
            onChange={(e) => onChange('addressLine', e.target.value)}
            onBlur={() => onBlur('addressLine')}
            placeholder={t('addressLinePlaceholder')}
            autoComplete="street-address"
            aria-invalid={!!err('addressLine')}
            className={cn(
              'h-10 rounded-xl border-border bg-background text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-400/15',
              err('addressLine') && 'border-red-300 focus:border-red-400 focus:ring-red-400/15'
            )}
          />
        </Field>

        <Field id="notes" label={t('notes')} error={undefined} className="sm:col-span-2">
          <textarea
            id="notes"
            value={values.notes}
            onChange={(e) => onChange('notes', e.target.value)}
            placeholder={t('notesPlaceholder')}
            rows={3}
            className="min-h-[84px] w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/15"
          />
        </Field>
      </div>
    </section>
  );
}

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

function Field({ id, label, error, required, className, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id} className="text-xs font-medium text-foreground">
        {label}
        {required ? <span className="ms-0.5 text-red-500" aria-hidden> *</span> : null}
      </Label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-red-500">{error}</p>
      ) : null}
    </div>
  );
}
