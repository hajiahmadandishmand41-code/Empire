import { ArrowLeft, Baby, BookOpen, Dumbbell, Home, Laptop, Smartphone, Watch, Shirt } from 'lucide-react';
import { Link } from '@/i18n/routing';

type Locale = 'fa' | 'ps' | 'en';

type PopularCategory = { key: string; label: Record<Locale, string>; href: string; icon: typeof Home; accent: string };

const categories: PopularCategory[] = [
  { key: 'home', label: { fa: 'لوازم خانگی', ps: 'د کور وسایل', en: 'Home appliances' }, href: '/shop?categoryKey=homeAppliances', icon: Home, accent: 'bg-emerald-500/10 text-emerald-600' },
  { key: 'digital', label: { fa: 'موبایل و دیجیتال', ps: 'موبایل او ډیجیټل', en: 'Mobile & digital' }, href: '/shop?categoryKey=digital', icon: Smartphone, accent: 'bg-sky-500/10 text-sky-600' },
  { key: 'electronics', label: { fa: 'لوازم هوشمند', ps: 'هوښیار وسایل', en: 'Smart devices' }, href: '/shop?categoryKey=electronics', icon: Laptop, accent: 'bg-violet-500/10 text-violet-600' },
  { key: 'fashion', label: { fa: 'مد و پوشاک', ps: 'فېشن او کالي', en: 'Fashion' }, href: '/shop?categoryKey=clothing', icon: Shirt, accent: 'bg-rose-500/10 text-rose-600' },
  { key: 'watches', label: { fa: 'ساعت و پوشیدنی', ps: 'ساعت او اغوستونکي', en: 'Watches & wearables' }, href: '/shop?categoryKey=watches', icon: Watch, accent: 'bg-amber-500/10 text-amber-700' },
  { key: 'sports', label: { fa: 'ورزش و سلامت', ps: 'ورزش او روغتیا', en: 'Sports & health' }, href: '/shop?categoryKey=sports', icon: Dumbbell, accent: 'bg-red-500/10 text-red-600' },
  { key: 'books', label: { fa: 'کتاب و فرهنگ', ps: 'کتاب او کلتور', en: 'Books & culture' }, href: '/shop?categoryKey=books', icon: BookOpen, accent: 'bg-cyan-500/10 text-cyan-600' },
  { key: 'baby', label: { fa: 'کودک و نوزاد', ps: 'ماشومان او نوي زېږېدلي', en: 'Baby & kids' }, href: '/shop?categoryKey=baby', icon: Baby, accent: 'bg-pink-500/10 text-pink-600' },
];

const copy = {
  fa: { title: 'دسته‌بندی‌های پربازدید', sub: 'محبوب‌ترین بخش‌های فروشگاه را سریع پیدا کنید.', all: 'همه دسته‌بندی‌ها' },
  ps: { title: 'ډېر لیدل کېدونکي وېشونه', sub: 'د پلورنځي مشهورې برخې په چټکۍ ومومئ.', all: 'ټولې وېشنیزې' },
  en: { title: 'Popular categories', sub: 'Jump to the busiest parts of the store.', all: 'All categories' },
} as const;

export async function ShopHotProducts({ locale }: { locale: Locale }) {
  const t = copy[locale];
  return (
    <section className="border-t border-border bg-background py-4 sm:py-6" aria-label={t.title}>
      <div className="mx-auto max-w-screen-xl px-3 sm:px-6">
        <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
          <div className="min-w-0">
            <h2 className="text-sm font-black sm:text-base">{t.title}</h2>
            <p className="mt-0.5 text-[9px] text-muted-foreground sm:text-[11px]">{t.sub}</p>
          </div>
          <Link href="/categories" className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-full border border-border bg-card px-2.5 text-[9px] font-bold hover:text-primary sm:min-h-9 sm:px-3 sm:text-[10px]">{t.all}<ArrowLeft className="h-3 w-3 rtl:rotate-180" aria-hidden="true" /></Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {categories.map(({ key, label, href, icon: Icon, accent }) => (
            <Link key={key} href={href as never} className="group flex min-h-[64px] items-center gap-2 rounded-2xl border border-border bg-card px-2.5 py-2 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md sm:min-h-[72px] sm:px-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <span className="min-w-0"><span className="block line-clamp-2 text-[10px] font-black leading-4 group-hover:text-primary sm:text-[11px]">{label[locale]}</span><span className="mt-0.5 block text-[8px] text-muted-foreground">{locale === 'en' ? 'Popular' : locale === 'ps' ? 'مشهور' : 'پربازدید'}</span></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
