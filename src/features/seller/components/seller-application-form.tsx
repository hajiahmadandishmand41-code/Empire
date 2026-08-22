'use client';

import * as React from 'react';
import { CheckCircle2, Loader2, Store } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function SellerApplicationForm({ initial }: { initial?: { shopName?: string | null; ownerName?: string | null; phone?: string | null; address?: string | null; description?: string | null } }) {
  const locale = useLocale();
  const router = useRouter();
  const [values, setValues] = React.useState({
    shopName: initial?.shopName ?? '',
    ownerName: initial?.ownerName ?? '',
    phone: initial?.phone ?? '',
    address: initial?.address ?? '',
    description: initial?.description ?? '',
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  const copy = locale === 'en'
    ? { title: 'Seller application', shop: 'Shop name', owner: 'Owner name', phone: 'Phone', address: 'Business address', description: 'What do you sell?', submit: 'Submit application', success: 'Application submitted. Our team will review it.', error: 'Could not submit the application.' }
    : locale === 'ps'
      ? { title: 'د پلورونکي غوښتنلیک', shop: 'د پلورنځي نوم', owner: 'د مالک نوم', phone: 'تلیفون', address: 'د کاروبار پته', description: 'تاسو څه شی پلورئ؟', submit: 'غوښتنلیک ولېږئ', success: 'غوښتنلیک ولېږل شو. زموږ ټیم به یې وڅېړي.', error: 'غوښتنلیک ونه لېږل شو.' }
      : { title: 'درخواست فروشندگی', shop: 'نام فروشگاه', owner: 'نام مالک', phone: 'شماره تماس', address: 'آدرس کسب‌وکار', description: 'چه محصولاتی می‌فروشید؟', submit: 'ارسال درخواست', success: 'درخواست شما ثبت شد و تیم ما آن را بررسی می‌کند.', error: 'ارسال درخواست ناموفق بود.' };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      const response = await fetch('/api/seller/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(values),
      });
      const data = await response.json().catch(() => null) as { ok?: boolean; error?: { message?: string } } | null;
      if (!response.ok || !data?.ok) {
        setError(data?.error?.message ?? copy.error);
        return;
      }
      setSuccess(true);
      router.refresh();
    } catch {
      setError(copy.error);
    } finally {
      setLoading(false);
    }
  }

  function set(key: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7" noValidate>
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Store className="h-5 w-5" /></span>
        <div><h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">{copy.title}</h1><p className="mt-1 text-sm text-muted-foreground">{copy.description}</p></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium"><span>{copy.shop} *</span><Input required value={values.shopName} onChange={(e) => set('shopName', e.target.value)} /></label>
        <label className="space-y-1.5 text-sm font-medium"><span>{copy.owner} *</span><Input required value={values.ownerName} onChange={(e) => set('ownerName', e.target.value)} /></label>
        <label className="space-y-1.5 text-sm font-medium"><span>{copy.phone} *</span><Input required inputMode="tel" dir="ltr" value={values.phone} onChange={(e) => set('phone', e.target.value)} /></label>
        <label className="space-y-1.5 text-sm font-medium"><span>{copy.address} *</span><Input required value={values.address} onChange={(e) => set('address', e.target.value)} /></label>
        <label className="space-y-1.5 text-sm font-medium sm:col-span-2"><span>{locale === 'fa' ? 'توضیح کوتاه' : locale === 'ps' ? 'لنډه پېژندنه' : 'Short description'}</span><textarea value={values.description} onChange={(e) => set('description', e.target.value)} rows={4} maxLength={1000} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" /></label>
      </div>
      {error ? <p role="alert" className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
      {success ? <p role="status" className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />{copy.success}</p> : null}
      <Button type="submit" disabled={loading || success} className="mt-5 h-11 w-full sm:w-auto">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {loading ? (locale === 'en' ? 'Submitting…' : locale === 'ps' ? 'لېږل کېږي…' : 'در حال ارسال…') : copy.submit}
      </Button>
    </form>
  );
}
