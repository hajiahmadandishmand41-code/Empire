import { getLocale, getTranslations } from 'next-intl/server';
import { ShieldCheck, Truck, RotateCcw, CreditCard, Award } from 'lucide-react';
import { Container } from '@/components/layout/container';

const items = [
  { key: 'purchase', icon: ShieldCheck },
  { key: 'shipping', icon: Truck },
  { key: 'returns', icon: RotateCcw },
  { key: 'payment', icon: CreditCard },
  { key: 'sellers', icon: Award },
] as const;

const fallback: Record<(typeof items)[number]['key'], { label: string; sub: string }> = {
  purchase: { label: 'خرید ۱۰۰٪ امن', sub: 'پرداخت و فرآیند شفاف' },
  shipping: { label: 'ارسال سریع', sub: 'به سراسر افغانستان' },
  returns: { label: 'ضمانت اصالت تمام', sub: 'قوانین شفاف مرجوعی' },
  payment: { label: 'پرداخت امن', sub: 'روش‌های پرداخت مطمئن' },
  sellers: { label: 'فروشندگان تأییدشده', sub: 'کیفیت بهتر، ریسک کمتر' },
};

export async function TrustSection() {
  const [t, locale] = await Promise.all([
    getTranslations('home.trustSection').catch(() => null),
    getLocale(),
  ]);

  const brand = locale === 'en' ? 'Eshop' : 'ایشاپ';
  const heading = locale === 'en' ? 'Shop with confidence' : locale === 'ps' ? 'په ډاډه زړه پیرود وکړئ' : 'خرید با خیال راحت';
  const subheading = locale === 'en' ? 'Trust, speed and clarity in every order' : locale === 'ps' ? 'په هره سپارښتنه کې باور، چټکتیا او روڼتیا' : 'اعتماد، سرعت و شفافیت در هر سفارش';

  return (
    <section aria-label={heading} className="border-b border-border bg-card py-7 sm:py-9">
      <Container size="xl">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">{brand}</p>
            <h2 className="mt-1 text-base font-black tracking-tight text-foreground sm:text-lg">{heading}</h2>
          </div>
          <p className="hidden text-xs text-muted-foreground sm:block">{subheading}</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5 sm:gap-3">
          {items.map(({ key, icon: Icon }) => {
            const labels = fallback[key];
            let label = labels.label;
            let sub = labels.sub;
            if (t) {
              try { label = t(`${key}.label` as never); } catch { /* fallback */ }
              try { sub = t(`${key}.sub` as never); } catch { /* fallback */ }
            }
            return (
              <div key={key} className="group/trust flex items-center gap-2.5 rounded-2xl border border-border/60 bg-gradient-to-br from-background to-muted/30 p-3 transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[var(--shadow-card-hover)]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary transition-all duration-300 group-hover/trust:shadow-glow">
                  <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-extrabold text-foreground">{label}</p>
                  <p className="mt-0.5 truncate text-[9px] text-muted-foreground">{sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
