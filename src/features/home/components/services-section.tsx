import { getTranslations } from 'next-intl/server';
import { Truck, CreditCard, ShieldCheck, Headphones } from 'lucide-react';
import { Container } from '@/components/layout/container';
import type { LucideIcon } from 'lucide-react';

type ServiceKey = 'delivery' | 'payment' | 'guarantee' | 'support';

const serviceConfig: Array<{
  key: ServiceKey;
  Icon: LucideIcon;
  color: string;
  iconBg: string;
  iconColor: string;
}> = [
  { key: 'delivery',  Icon: Truck,       color: 'bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900',       iconBg: 'bg-blue-100 dark:bg-blue-900/40',    iconColor: 'text-blue-600 dark:text-blue-400' },
  { key: 'payment',   Icon: CreditCard,  color: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'guarantee', Icon: ShieldCheck, color: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900',    iconBg: 'bg-amber-100 dark:bg-amber-900/40',  iconColor: 'text-amber-600 dark:text-amber-400' },
  { key: 'support',   Icon: Headphones,  color: 'bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900', iconBg: 'bg-purple-100 dark:bg-purple-900/40', iconColor: 'text-purple-600 dark:text-purple-400' },
];

export async function ServicesSection() {
  const t = await getTranslations('home.services');

  return (
    <section aria-labelledby="services-title" className="bg-background py-6 sm:py-8 border-b border-border">
      <Container size="xl">
        <h2 id="services-title" className="sr-only">{t('title')}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {serviceConfig.map(({ key, Icon, color, iconBg, iconColor }) => (
            <div
              key={key}
              className={`flex items-start gap-3 rounded-xl border p-4 transition-all hover:shadow-sm ${color}`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                <Icon className={`h-4 w-4 ${iconColor}`} aria-hidden />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-foreground">{t(`${key}.title` as Parameters<typeof t>[0])}</h3>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground hidden sm:block">
                  {t(`${key}.description` as Parameters<typeof t>[0])}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
