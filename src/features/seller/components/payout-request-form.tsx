'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { formatMoney } from '@/features/admin/lib/format';
import { Building2, Wallet2, Landmark, Info, CheckCircle2 } from 'lucide-react';

interface PaymentAccount {
  sellerBankAccountNumber?: string | null;
  sellerBankAccountName?: string | null;
  sellerBankName?: string | null;
  sellerAtomaPay?: string | null;
}

interface Props {
  balance: number;
  currency: string;
}

const METHODS = [
  { key: 'bank_transfer', label: 'انتقال بانکی', icon: Landmark },
  { key: 'atoma_pay', label: 'ATOMA Pay', icon: Wallet2 },
  { key: 'cash', label: 'نقدی', icon: Building2 },
  { key: 'whatsapp', label: 'واتساپ‌پی', icon: Building2 },
] as const;

type Method = (typeof METHODS)[number]['key'];

/**
 * Seller-side form for requesting a payout.
 * Auto-fills account info from the seller's saved payment account settings.
 */
export function PayoutRequestForm({ balance, currency }: Props) {
  const [amount, setAmount] = React.useState('');
  const [method, setMethod] = React.useState<Method>('bank_transfer');
  const [accountInfo, setAccountInfo] = React.useState('');
  const [note, setNote] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [savedAccount, setSavedAccount] = React.useState<PaymentAccount | null>(null);
  const [autoFilled, setAutoFilled] = React.useState(false);

  // Load saved payment account from seller settings
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/seller/settings', { credentials: 'include' });
        const json = await res.json();
        if (json?.ok && json.data) {
          const d = json.data as PaymentAccount;
          setSavedAccount(d);
        }
      } catch {
        // silently ignore
      }
    })();
  }, []);

  // Auto-fill account info when method changes and saved account is available
  React.useEffect(() => {
    if (!savedAccount) return;
    let filled = '';
    if (method === 'bank_transfer') {
      const parts: string[] = [];
      if (savedAccount.sellerBankName) parts.push(savedAccount.sellerBankName);
      if (savedAccount.sellerBankAccountNumber) parts.push(savedAccount.sellerBankAccountNumber);
      if (savedAccount.sellerBankAccountName) parts.push(`به‌نام: ${savedAccount.sellerBankAccountName}`);
      filled = parts.join(' — ');
    } else if (method === 'atoma_pay') {
      filled = savedAccount.sellerAtomaPay ?? '';
    }
    if (filled) {
      setAccountInfo(filled);
      setAutoFilled(true);
    } else {
      setAutoFilled(false);
    }
  }, [method, savedAccount]);

  const hasSavedPayment =
    savedAccount &&
    (savedAccount.sellerBankAccountNumber || savedAccount.sellerBankName || savedAccount.sellerAtomaPay);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    if (!(n > 0)) {
      toast.error('مبلغ باید بزرگ‌تر از صفر باشد.');
      return;
    }
    if (n > balance) {
      toast.error('مبلغ بیشتر از موجودی قابل برداشت است.');
      return;
    }
    if (accountInfo.trim().length < 3) {
      toast.error('اطلاعات حساب دریافت وجه را وارد کنید.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/seller/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount.trim(),
          method,
          accountInfo: accountInfo.trim(),
          sellerNote: note.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.error?.message || 'ثبت درخواست ناموفق بود.');
      }
      toast.success('درخواست برداشت با موفقیت ثبت شد.');
      setAmount('');
      setNote('');
      // Refresh server components.
      if (typeof window !== 'undefined') window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطای غیرمنتظره');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-border bg-background shadow-sm p-5">
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground">درخواست برداشت</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          موجودی قابل برداشت:{' '}
          <span className="font-semibold text-emerald-600">{formatMoney(balance, currency)}</span>
        </p>
      </div>

      {/* Saved payment account notice */}
      {hasSavedPayment && (
        <div className="flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/50 px-3 py-2.5">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
          <p className="text-xs text-emerald-800 dark:text-emerald-300">
            اطلاعات حساب از تنظیمات فروشگاه شما بارگذاری شده است. در صورت نیاز می‌توانید ویرایش کنید.
          </p>
        </div>
      )}

      {!hasSavedPayment && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/50 px-3 py-2.5">
          <Info className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
          <p className="text-xs text-amber-800 dark:text-amber-300">
            برای سهولت در برداشت‌های آینده، اطلاعات حساب بانکی یا ATOMA Pay را در{' '}
            <a href="seller/settings" className="font-semibold underline">تنظیمات فروشگاه</a>{' '}
            ذخیره کنید.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Amount */}
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-semibold text-muted-foreground">مبلغ ({currency})</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max={balance}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20"
            required
          />
        </label>

        {/* Method */}
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-semibold text-muted-foreground">روش برداشت</span>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as Method)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20"
          >
            {METHODS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Account info */}
      <label className="flex flex-col gap-1 text-sm">
        <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          {method === 'atoma_pay' ? 'شناسه ATOMA Pay' : 'اطلاعات حساب'}
          {autoFilled && (
            <span className="text-[10px] font-normal text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              پر شده خودکار
            </span>
          )}
        </span>
        <input
          type="text"
          value={accountInfo}
          onChange={(e) => {
            setAccountInfo(e.target.value);
            setAutoFilled(false);
          }}
          placeholder={
            method === 'atoma_pay'
              ? 'مثال: +93XXXXXXXXX یا ATOMA ID'
              : method === 'bank_transfer'
              ? 'مثال: کابل بانک — 1234567890 — به‌نام محمد'
              : 'اطلاعات حساب برای دریافت وجه'
          }
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground dir-ltr outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20"
          required
          dir="ltr"
        />
      </label>

      {/* Seller note */}
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-xs font-semibold text-muted-foreground">یادداشت (اختیاری)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20"
        />
      </label>

      <button
        type="submit"
        disabled={submitting || balance <= 0}
        className="w-full inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            در حال ارسال…
          </span>
        ) : (
          'ثبت درخواست برداشت'
        )}
      </button>
    </form>
  );
}
