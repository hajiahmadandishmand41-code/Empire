import Link from 'next/link';
import { EmptyState } from '@/features/admin/components/empty-state';
import { formatMoney, formatDate } from '@/features/admin/lib/format';
import { requireAdmin } from '@/lib/auth/roles';
import { listAllPayouts } from '@/features/seller/lib/wallet-queries';
import { PayoutActions } from '@/features/admin/components/payout-actions';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}

const TABS = [
  { key: 'pending', label: 'در انتظار' },
  { key: 'approved', label: 'تایید شده' },
  { key: 'paid', label: 'پرداخت‌شده' },
  { key: 'rejected', label: 'رد شده' },
  { key: 'all', label: 'همه' },
] as const;

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-800',
  paid: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
};

export default async function AdminPayoutsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  await requireAdmin({ locale });
  const sp = await searchParams;
  const current = (sp.status as (typeof TABS)[number]['key']) ?? 'pending';
  const status = current === 'all' ? undefined : (current as 'pending' | 'approved' | 'paid' | 'rejected');

  const payouts = await listAllPayouts(status);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-2xl font-bold text-navy-800">درخواست‌های برداشت</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          مدیریت پرداخت به فروشندگان و پیگیری وضعیت هر درخواست
        </p>
      </header>

      <nav className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = t.key === current;
          return (
            <Link
              key={t.key}
              href={`/${locale}/admin/payouts${t.key === 'pending' ? '' : `?status=${t.key}`}`}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground hover:bg-muted/50'
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      {payouts.length === 0 ? (
        <EmptyState title="هیچ درخواستی نیست" description="در حال حاضر درخواست برداشتی با این وضعیت وجود ندارد." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-background">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-5 py-2 text-start">کد</th>
                <th className="px-5 py-2 text-start">فروشنده</th>
                <th className="px-5 py-2 text-start">مبلغ</th>
                <th className="px-5 py-2 text-start">روش</th>
                <th className="px-5 py-2 text-start">اطلاعات حساب</th>
                <th className="px-5 py-2 text-start">وضعیت</th>
                <th className="px-5 py-2 text-start">تاریخ</th>
                <th className="px-5 py-2 text-start">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payouts.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-3 font-mono text-xs">{p.reference}</td>
                  <td className="px-5 py-3">
                    <div className="font-medium">{p.seller.sellerShopName || p.seller.fullName}</div>
                    <div className="text-xs text-muted-foreground">{p.seller.email ?? p.seller.id.slice(0, 8)}</div>
                  </td>
                  <td className="px-5 py-3 font-semibold">{formatMoney(p.amount, p.currency)}</td>
                  <td className="px-5 py-3">{p.method}</td>
                  <td className="px-5 py-3 max-w-[220px] truncate" title={p.accountInfo}>
                    {p.accountInfo}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[p.status]}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {formatDate(p.createdAt.toISOString())}
                  </td>
                  <td className="px-5 py-3">
                    <PayoutActions payoutId={p.id} status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
