import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { EmptyState } from '@/features/admin/components/empty-state';
import { Pagination } from '@/features/admin/components/pagination';
import { formatMoney, formatDate } from '@/features/admin/lib/format';
import { requireAdmin } from '@/lib/auth/roles';
import { listAllPayoutsPaged } from '@/features/seller/lib/wallet-queries';
import { PayoutActions } from '@/features/admin/components/payout-actions';

export const dynamic = 'force-dynamic';
interface Props { params: Promise<{ locale: string }>; searchParams: Promise<{ status?: string; page?: string; pageSize?: string }> }
const STATUS_STYLE: Record<string, string> = { pending: 'bg-amber-100 text-amber-800', approved: 'bg-blue-100 text-blue-800', paid: 'bg-emerald-100 text-emerald-800', rejected: 'bg-red-100 text-red-800' };

export default async function AdminPayoutsPage({ params, searchParams }: Props) {
  const { locale } = await params; await requireAdmin({ locale }); const sp = await searchParams; const t = await getTranslations('admin.payoutsPage');
  const current = (sp.status ?? 'pending') as 'pending' | 'approved' | 'paid' | 'rejected' | 'all';
  const status = current === 'all' ? undefined : current;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const pageSize = Math.min(50, Math.max(10, parseInt(sp.pageSize ?? '20', 10) || 20));
  const result = await listAllPayoutsPaged(status, page, pageSize);
  const tabs = [['pending', t('pending')], ['approved', t('approved')], ['paid', t('paid')], ['rejected', t('rejected')], ['all', t('all')]] as const;
  return <div className="space-y-5">
    <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="font-display text-2xl font-black text-foreground">{t('title')}</h2><p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p></div><div className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">{result.total.toLocaleString(locale)} مورد</div></header>
    <nav className="flex flex-wrap gap-2" aria-label="فیلتر وضعیت برداشت">{tabs.map(([key,label]) => <Link key={key} href={`/${locale}/admin/payouts${key === 'pending' ? '' : `?status=${key}`}`} className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${current === key ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border bg-background text-foreground hover:bg-muted/50'}`}>{label}</Link>)}</nav>
    {result.total === 0 ? <EmptyState title={t('empty')} description={t('emptyHint')} /> : <div className="space-y-3"><div className="overflow-x-auto rounded-2xl border border-border bg-background"><table className="w-full min-w-[980px] text-sm"><thead className="bg-muted/40 text-xs text-muted-foreground"><tr><th className="px-5 py-3 text-start">{t('code')}</th><th className="px-5 py-3 text-start">{t('seller')}</th><th className="px-5 py-3 text-start">{t('amount')}</th><th className="px-5 py-3 text-start">{t('method')}</th><th className="px-5 py-3 text-start">{t('account')}</th><th className="px-5 py-3 text-start">{t('status')}</th><th className="px-5 py-3 text-start">{t('date')}</th><th className="px-5 py-3 text-start">{t('actions')}</th></tr></thead><tbody className="divide-y divide-border">{result.items.map((p) => <tr key={p.id} className="hover:bg-muted/20"><td className="px-5 py-3 font-mono text-xs">{p.reference}</td><td className="px-5 py-3"><div className="font-medium">{p.seller.sellerShopName || p.seller.fullName}</div><div className="text-xs text-muted-foreground">{p.seller.email ?? p.seller.id.slice(0,8)}</div></td><td className="px-5 py-3 font-bold">{formatMoney(p.amount, p.currency)}</td><td className="px-5 py-3">{p.method}</td><td className="max-w-[220px] truncate px-5 py-3" title={p.accountInfo}>{p.accountInfo}</td><td className="px-5 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[p.status] ?? 'bg-muted text-muted-foreground'}`}>{t.has(p.status) ? t(p.status) : p.status}</span></td><td className="px-5 py-3 text-xs text-muted-foreground">{formatDate(p.createdAt.toISOString())}</td><td className="px-5 py-3"><PayoutActions payoutId={p.id} status={p.status} /></td></tr>)}</tbody></table></div><Pagination page={result.page} pageSize={result.pageSize} total={result.total} /></div>}
  </div>;
}
