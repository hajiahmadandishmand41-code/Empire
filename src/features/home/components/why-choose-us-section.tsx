import { getTranslations } from 'next-intl/server';
import { ShieldCheck, Globe2, Heart, Package } from 'lucide-react';
import { Container } from '@/components/layout/container';
import { Grid } from '@/components/layout/grid';
import type { LucideIcon } from 'lucide-react';

export async function WhyChooseUsSection() {
  const t = await getTranslations('home.why').catch(() => null);

  const items: Array<{ key: string; Icon: LucideIcon; color: string; bg: string }> = [
    { key: 'authentic', Icon: ShieldCheck, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30' },
    { key: 'global',    Icon: Globe2,      color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { key: 'artisans',  Icon: Heart,       color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30' },
    { key: 'packaging', Icon: Package,     color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  ];

  const fallbacks: Record<string, { title: string; description: string }> = {
    authentic: { title: 'محصولات اصل', description: 'ضمانت اصالت تمام محصولات' },
    global: { title: 'ارسال به همه جا', description: 'ارسال سریع به سراسر افغانستان' },
    artisans: { title: 'حمایت از صنعتگران', description: 'پشتیبانی از تولیدکنندگان افغانستانی' },
    packaging: { title: 'بسته‌بندی حرفه‌ای', description: 'تحویل سالم با بسته‌بندی استاندارد' },
  };

  return (
    <section aria-labelledby="why-title" className="bg-muted/40 py-8 sm:py-10 border-b border-border">
      <Container size="xl">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="h-5 w-1 rounded-full bg-rose-600" aria-hidden />
          <div>
            <h2 id="why-title" className="text-base font-bold text-foreground sm:text-lg">
              {t ? t('sectionTitle') : 'چرا EmpireShop؟'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t ? t('sectionSubtitle') : 'دلایلی که خرید از ما را لذت‌بخش می‌کند'}
            </p>
          </div>
        </div>

        <Grid cols={2} gap="4">
          {items.map(({ key, Icon, color, bg }) => {
            const fallback = fallbacks[key];
            let title = fallback.title;
            let description = fallback.description;
            if (t) {
              try { title = t(`${key}.title` as Parameters<typeof t>[0]); } catch {}
              try { description = t(`${key}.description` as Parameters<typeof t>[0]); } catch {}
            }
            return (
              <div
                key={key}
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-rose-200 dark:hover:border-rose-800 hover:shadow-sm"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} aria-hidden />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
                </div>
              </div>
            );
          })}
        </Grid>
      </Container>
    </section>
  );
}
