import { requireSeller } from '@/lib/auth/roles';
import { getSellerOrderSummary, listSellerOrders, OrderList } from '@/features/orders';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; status?: string; q?: string }>;
}

const filters = [
  { key: '', label: 'همه' },
  { key: 'pending', label: 'در انتظار' },
  { key: 'confirmed', label: 'تأیید شده' },
  { key: 'processing', label: 'در حال پردازش' },
  { key: 'shipped', label: 'ارسال شده' },
  { key: 'delivered', label: 'تحویل شده' },
  { key: 'cancelled', label: 'لغو شده' },
];

export default async function SellerOrdersPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const user = await requireSeller({ locale });

  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const [result, summary] = await Promise.all([
    listSellerOrders({
      sellerId: user.id,
      page,
      pageSize: 20,
      status: sp.status,
      q: sp.q,
    }),
    getSellerOrderSummary(user.id),
  ]);

  const base = `/${locale}/seller/orders`;

  return (
    <div className="space-y-5">
      <header>
        <h2 className="font-display text-2xl font-bold text-navy-800">سفارش‌های من</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          سفارش‌هایی که حاوی محصولات شما هستند؛ جستجو و پیگیری وضعیت در یک صفحه.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="کل سفارش‌ها" value={summary.total} tone="neutral" />
        <SummaryCard label="در انتظار" value={summary.pending + summary.confirmed} tone="warning" />
        <SummaryCard label="در حال انجام" value={summary.processing + summary.shipped} tone="info" />
        <SummaryCard label="تحویل شده" value={summary.delivered} tone="success" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
        <form method="get" action={base} className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <input
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder="جستجو با شماره سفارش یا نام مشتری…"
            className="h-10 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
          <input type="hidden" name="page" value="1" />
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <button type="submit" className="h-10 rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition hover:opacity-90">
            جستجو
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2" aria-label="فیلتر وضعیت سفارش">
          {filters.map((filter) => {
            const href = new URLSearchParams();
            if (sp.q) href.set('q', sp.q);
            if (filter.key) href.set('status', filter.key);
            href.set('page', '1');
            const active = (sp.status ?? '') === filter.key;
            const count = filter.key ? summary[filter.key as keyof typeof summary] : summary.total;
            return (
              <a
                key={filter.key || 'all'}
                href={`${base}?${href.toString()}`}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                }`}
              >
                {filter.label}
                <span className="rounded-full bg-background/70 px-1.5 py-0.5 text-[10px]">{Number(count).toLocaleString('fa-IR')}</span>
              </a>
            );
          })}
        </div>
      </div>

      <OrderList
        orders={result.items}
        hrefBase={base}
        emptyTitle={sp.q || sp.status ? 'سفارشی با این فیلتر پیدا نشد' : 'سفارشی برای محصولات شما ثبت نشده'}
        emptyDescription={sp.q || sp.status ? 'فیلتر یا عبارت جستجو را تغییر دهید.' : 'پس از فروش محصولات، سفارش‌ها اینجا نمایش داده می‌شوند.'}
      />

      {result.total > result.pageSize && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>صفحه {result.page.toLocaleString('fa-IR')}</span>
          <div className="flex items-center gap-2">
            {result.page > 1 && <PagerLink href={`${base}?${params(sp, result.page - 1)}`} label="قبلی" />}
            {result.page * result.pageSize < result.total && <PagerLink href={`${base}?${params(sp, result.page + 1)}`} label="بعدی" />}
          </div>
        </div>
      )}
    </div>
  );
}

function params(sp: { q?: string; status?: string }, page: number) {
  const query = new URLSearchParams({ page: String(page) });
  if (sp.q) query.set('q', sp.q);
  if (sp.status) query.set('status', sp.status);
  return query.toString();
}

function PagerLink({ href, label }: { href: string; label: string }) {
  return <a href={href} className="rounded-xl border border-border bg-card px-3 py-2 font-semibold text-foreground hover:bg-muted">{label}</a>;
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: 'neutral' | 'warning' | 'info' | 'success' }) {
  const toneClass = {
    neutral: 'border-border bg-card',
    warning: 'border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20',
    info: 'border-sky-200 bg-sky-50/60 dark:border-sky-900/40 dark:bg-sky-950/20',
    success: 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20',
  }[tone];
  return <div className={`rounded-2xl border p-4 ${toneClass}`}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-black">{value.toLocaleString('fa-IR')}</p></div>;
}
