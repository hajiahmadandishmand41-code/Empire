'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CategoryOption { id: string; name: string }
export interface AdminProductFormValue {
  id?: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  currency: string;
  categoryId: string;
  region: string;
  badge: string;
  inStock: boolean;
}

interface ProductFormProps {
  locale: string;
  categories: CategoryOption[];
  initial?: AdminProductFormValue;
  labels: {
    createTitle: string;
    editTitle: string;
    name: string;
    slug: string;
    shortDescription: string;
    description: string;
    price: string;
    currency: string;
    category: string;
    region: string;
    badge: string;
    inStock: string;
    save: string;
    create: string;
    back: string;
    required: string;
    success: string;
    error: string;
    cancel: string;
  };
}

export function ProductForm({ locale, categories, initial, labels }: ProductFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [busy, setBusy] = React.useState(false);
  const [form, setForm] = React.useState<AdminProductFormValue>(initial ?? {
    slug: '', name: '', shortDescription: '', description: '', price: 0,
    currency: 'AFN', categoryId: categories[0]?.id ?? '', region: '', badge: '', inStock: true,
  });

  function update<K extends keyof AdminProductFormValue>(key: K, value: AdminProductFormValue[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function requiredText(value: string) {
    return value.trim().length >= 1;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requiredText(form.name) || !requiredText(form.shortDescription) || !requiredText(form.region) || !form.categoryId || form.price <= 0) {
      toast.error(labels.required);
      return;
    }

    setBusy(true);
    try {
      const endpoint = isEdit ? `/api/admin/products/${form.id}` : '/api/admin/products';
      const payload = isEdit
        ? { name: form.name.trim(), shortDescription: form.shortDescription.trim(), description: form.description.trim(), price: form.price, inStock: form.inStock, badge: form.badge.trim() || null, region: form.region.trim() }
        : { slug: form.slug.trim(), name: form.name.trim(), shortDescription: form.shortDescription.trim(), description: form.description.trim(), price: form.price, currency: form.currency, categoryId: form.categoryId, region: form.region.trim(), badge: form.badge.trim() || undefined, inStock: form.inStock };

      const response = await fetch(endpoint, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.ok) {
        throw new Error(body?.error?.message ?? labels.error);
      }
      toast.success(labels.success);
      router.push(`/${locale}/admin/products`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : labels.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="font-display text-2xl font-bold text-navy-800">{isEdit ? labels.editTitle : labels.createTitle}</h1></div>
        <Button type="button" variant="outline" onClick={() => router.push(`/${locale}/admin/products`)}>{labels.back}</Button>
      </header>

      <form onSubmit={submit} className="space-y-5">
        <Card className="grid gap-4 p-5 md:grid-cols-2">
          <Field label={labels.name} value={form.name} onChange={(value) => update('name', value)} required />
          <Field label={labels.slug} value={form.slug} onChange={(value) => update('slug', value)} required disabled={isEdit} />
          <Field label={labels.shortDescription} value={form.shortDescription} onChange={(value) => update('shortDescription', value)} required />
          <Field label={labels.region} value={form.region} onChange={(value) => update('region', value)} required />
          <Field label={labels.price} value={String(form.price || '')} onChange={(value) => update('price', Number(value) || 0)} type="number" min="0" step="0.01" required />
          <SelectField label={labels.currency} value={form.currency} onChange={(value) => update('currency', value)} disabled={isEdit} options={[['AFN','AFN'],['USD','USD'],['EUR','EUR']]} />
          <SelectField label={labels.category} value={form.categoryId} onChange={(value) => update('categoryId', value)} disabled={isEdit} options={categories.map((category) => [category.id, category.name])} />
          <Field label={labels.badge} value={form.badge} onChange={(value) => update('badge', value)} />
          <div className="md:col-span-2">
            <label className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm font-medium">
              <input type="checkbox" checked={form.inStock} onChange={(event) => update('inStock', event.target.checked)} className="h-4 w-4 rounded" />
              {labels.inStock}
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-foreground">{labels.description}</label>
            <textarea value={form.description} onChange={(event) => update('description', event.target.value)} rows={7} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" />
          </div>
        </Card>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push(`/${locale}/admin/products`)} disabled={busy}>{labels.cancel}</Button>
          <Button type="submit" disabled={busy}>{busy ? labels.save : isEdit ? labels.save : labels.create}</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', min, step, required = false, disabled = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; min?: string; step?: string; required?: boolean; disabled?: boolean }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold text-foreground">{label}</span><input type={type} min={min} step={step} required={required} disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60" /></label>;
}

function SelectField({ label, value, onChange, options, disabled = false }: { label: string; value: string; onChange: (value: string) => void; options: string[][]; disabled?: boolean }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold text-foreground">{label}</span><select disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}
