import { Wallet, TrendingUp, ArrowDownToLine, Percent, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { StatCard } from '@/features/admin/components/stat-card';
import { EmptyState } from '@/features/admin/components/empty-state';
import { formatMoney, formatDate } from '@/features/admin/lib/format';
import { requireSeller } from '@/lib/auth/roles';
import {
  getWalletSummary,
  listWalletTransactions,
  listSellerPayouts,
} from '@/features/seller/lib/wallet-queries';
import { PayoutRequestForm } from '@/features/seller/components/payout-request-form';
import { prisma, isDatabaseConfigured } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
}

const TX_LABEL: Record<string, string> = {
  sale: 'فروش',
  commission: 'کمیسیون',
  payout: 'برداشت',
  payout_reversal: 'بازگشت برداشت',
  refund: 'بازگشت وجه',
  adjustment: 'اصلاح',
};

const TX_COLOR: Record<string, string> = {
  sale: 'text-emerald-600',
  payout: 'text-red-600',
  payout_reversal: 'text-emerald-600',
  refund: 'text-red-600',
  commission: 'text-muted-foreground',
  adjustment: 'text-muted-foreground',
};

const PAYOUT_STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: 'در انتظار بررسی', tone: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  approved: { label: 'تایید شده', tone: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  paid: { label: '✓ پرداخت شد', tone: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  rejected: { label: 'رد شد', tone: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
};

const METHOD_LABEL: Record<string, string> = {
  bank_transfer: 'انتقال بانکی',
  cash: 'نقدی',
  whatsapp: 'واتساپ‌پی',
  atoma_pay: 'ATOMA Pay',
};

async function getSellerPaymentAccount(sellerId: string) {
  if (!isDatabaseConfigured()) return null;
  try {
    return await prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        sellerBankAccountNumber: true,
        sellerBankAccountName: true,
        sellerBankName: true,
        sellerAtomaPay: true,
      },
    });
  } catch {
    return null;
  }
}

export default async function SellerWalletPage({ params }: Props) {
  const { locale } = await params;
  const user = await requireSeller({ locale });

  const [summary, transactions, payouts, paymentAccount] = await Promise.all([
    getWalletSummary(user.id),
    listWalletTransactions(user.id, 30),
    listSellerPayouts(user.id, 20),
    getSellerPaymentAccount(user.id),
  ]);

  const hasPaymentAccount =
    paymentAccount &&
    (paymentAccount.sellerBankAccountNumber ||
      paymentAccount.sellerBankName ||
      paymentAccount.sellerAtomaPay);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-2xl font-bold text-navy-800">کیف پول</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          موجودی، تراکنش‌ها و درخواست‌های برداشت شما
        </p>
      </header>

      {/* Balance stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="موجودی قابل برداشت"
          value={formatMoney(summary.balance, summary.currency)}
          icon={<Wallet className="h-5 w-5" />}
          tone="success"
        />
        <StatCard
          label="کل درآمد"
          value={formatMoney(summary.totalEarned, summary.currency)}
          icon={<TrendingUp className="h-5 w-5" />}
          tone="info"
        />
        <StatCard
          label="کل برداشت‌ها"
          value={formatMoney(summary.totalPaidOut, summary.currency)}
          icon={<ArrowDownToLine className="h-5 w-5" />}
          tone="default"
        />
        <StatCard
          label="کمیسیون Empire Shop"
          value={`${summary.commissionRate}%`}
          icon={<Percent className="h-5 w-5" />}
          tone="default"
        />
      </section>

      {/* Linked payment account banner */}
      {hasPaymentAccount ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/30 px-5 py-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-emerald-600 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-emerald-800 dark:text-emerald-300">حساب پرداخت ثبت‌شده: </span>
              <span className="text-emerald-700 dark:text-emerald-400">
                {[
                  paymentAccount.sellerBankName,
                  paymentAccount.sellerBankAccountNumber,
                  paymentAccount.sellerAtomaPay ? `ATOMA: ${paymentAccount.sellerAtomaPay}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </div>
          </div>
          <Link
            href={`/${locale}/seller/settings`}
            className="text-xs font-medium text-emerald-700 dark:text-emerald-300 underline hover:no-underline"
          >
            ویرایش
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 px-5 py-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-300">
              <span className="font-semibold">حساب بانکی یا ATOMA Pay ثبت نشده.</span>{' '}
              برای تسویه‌حساب سریع‌تر، اطلاعات حساب را ثبت کنید.
            </p>
          </div>
          <Link
            href={`/${locale}/seller/settings`}
            className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
          >
            ثبت حساب
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Payout request form */}
        <PayoutRequestForm balance={summary.balance} currency={summary.currency} />

        {/* Recent transactions */}
        <section className="rounded-2xl border border-border bg-background shadow-sm">
          <header className="border-b border-border px-5 py-3">
            <h3 className="font-display text-lg font-semibold text-navy-800">تراکنش‌های اخیر</h3>
          </header>
          {transactions.length === 0 ? (
            <EmptyState
              title="هنوز تراکنشی ثبت نشده"
              description="بعد از تحویل نخستین سفارش، درآمد شما اینجا نمایش داده می‌شود."
            />
          ) : (
            <ul className="divide-y divide-border">
              {transactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {TX_LABEL[tx.type] ?? tx.type}
                    </p>
                    {tx.description ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">{tx.description}</p>
                    ) : null}
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatDate(tx.createdAt.toISOString())}
                    </p>
                  </div>
                  <span
                    className={`whitespace-nowrap text-sm font-semibold ${TX_COLOR[tx.type] ?? (tx.amount >= 0 ? 'text-emerald-600' : 'text-red-600')}`}
                  >
                    {tx.amount >= 0 ? '+' : ''}
                    {formatMoney(tx.amount, tx.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Payouts history */}
      <section className="rounded-2xl border border-border bg-background shadow-sm">
        <header className="border-b border-border px-5 py-3 flex items-center justify-between gap-2">
          <h3 className="font-display text-lg font-semibold text-navy-800">تاریخچه درخواست‌های برداشت</h3>
          <span className="text-xs text-muted-foreground">{payouts.length} درخواست</span>
        </header>
        {payouts.length === 0 ? (
          <EmptyState
            title="هنوز درخواستی ثبت نشده"
            description="پس از ثبت درخواست، وضعیت آن اینجا نمایش داده می‌شود."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-2 text-start font-medium">کد پیگیری</th>
                  <th className="px-5 py-2 text-start font-medium">مبلغ</th>
                  <th className="px-5 py-2 text-start font-medium">روش</th>
                  <th className="px-5 py-2 text-start font-medium">حساب مقصد</th>
                  <th className="px-5 py-2 text-start font-medium">وضعیت</th>
                  <th className="px-5 py-2 text-start font-medium">تاریخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payouts.map((p) => {
                  const badge = PAYOUT_STATUS[p.status] ?? {
                    tone: 'bg-muted text-foreground',
                    label: p.status,
                  };
                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                        {p.reference}
                      </td>
                      <td className="px-5 py-3 font-semibold text-foreground">
                        {formatMoney(p.amount, p.currency)}
                      </td>
                      <td className="px-5 py-3 text-xs">
                        {METHOD_LABEL[p.method] ?? p.method}
                      </td>
                      <td
                        className="px-5 py-3 text-xs text-muted-foreground max-w-[200px] truncate"
                        title={p.accountInfo}
                        dir="ltr"
                      >
                        {p.accountInfo}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.tone}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {formatDate(p.createdAt.toISOString())}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
