import { getTranslations } from 'next-intl/server';
import { Container } from '@/components/layout/container';
import { Grid } from '@/components/layout/grid';
import { Users, Package, Star, Award } from 'lucide-react';

export async function StorySection() {
  const t = await getTranslations('home.story').catch(() => null);

  const stats = [
    { Icon: Users, value: '+۵۰,۰۰۰', label: 'مشتری فعال', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { Icon: Package, value: '+۱۰,۰۰۰', label: 'محصول موجود', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { Icon: Star, value: '۴.۸', label: 'میانگین امتیاز', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { Icon: Award, value: '+۵ سال', label: 'سابقه فعالیت', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30' },
  ];

  return (
    <section aria-labelledby="story-title" className="border-b border-border bg-background py-10 sm:py-12">
      <Container size="xl">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Text */}
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                داستان ما
              </p>
              <h2 id="story-title" className="mt-2 text-xl font-bold text-foreground sm:text-2xl leading-snug">
                {t ? t('title') : 'پیشرو در فروش آنلاین افغانستان'}
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t ? t('body') : 'EmpireShop با هدف ارائه بهترین تجربه خرید آنلاین در افغانستان تأسیس شده است. ما با فروشندگان معتبر و برندهای شناخته‌شده همکاری می‌کنیم تا بهترین محصولات را با بهترین قیمت به دست شما برسانیم.'}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t ? t('body2') : 'با بیش از ۵ سال سابقه فعالیت، اعتماد هزاران مشتری را کسب کرده‌ایم و هر روز تلاش می‌کنیم خدمات خود را بهتر کنیم.'}
            </p>
          </div>

          {/* Stats */}
          <Grid cols={2} gap="4">
            {stats.map(({ Icon, value, label, color, bg }) => (
              <div key={label} className="flex flex-col items-center gap-2.5 rounded-2xl border border-border p-5 text-center">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-6 w-6 ${color}`} aria-hidden />
                </div>
                <div>
                  <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </Grid>
        </div>
      </Container>
    </section>
  );
}
