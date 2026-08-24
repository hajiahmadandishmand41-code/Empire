import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowLeft, ArrowUpRight, ChevronLeft, FolderTree, Package, Sparkles } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { getCategoryRepository } from '@/server/infrastructure/registry';

const names: Record<string, Record<string, string>> = {
  fa: { clothing: 'پوشاک', digital: 'موبایل و دیجیتال', homeAppliances: 'خانه و آشپزخانه', beauty: 'بهداشت و زیبایی', sports: 'ورزش', footwear: 'کفش و کیف', baby: 'کودک و نوزاد', books: 'کتاب و آموزش', electronics: 'لوازم الکترونیکی', watches: 'ساعت و اکسسوری' },
  ps: { clothing: 'جامې', digital: 'موبایل او ډیجیټل', homeAppliances: 'کور او پخلنځی', beauty: 'روغتیا او ښکلا', sports: 'ورزش', footwear: 'بوټان او بکسونه', baby: 'ماشومان', books: 'کتابونه او زده کړه', electronics: 'برېښنایي وسایل', watches: 'ساعتونه او لوازم' },
  en: { clothing: 'Clothing', digital: 'Mobile & Digital', homeAppliances: 'Home & Kitchen', beauty: 'Beauty & Care', sports: 'Sports', footwear: 'Footwear & Bags', baby: 'Baby & Kids', books: 'Books & Learning', electronics: 'Electronics', watches: 'Watches & Accessories' },
};

const copy = {
  fa: { title: 'دسته‌بندی‌ها', subtitle: 'دسته اصلی را انتخاب کنید، زیر‌دسته‌ها را ببینید و سریع به محصولات بروید.', back: 'بازگشت به خانه', all: 'همه دسته‌ها', sub: 'زیر‌دسته‌ها', products: 'محصول', open: 'مشاهده محصولات', path: 'مسیر انتخاب', noSub: 'این دسته فعلاً زیر‌دسته‌ای ندارد.' },
  ps: { title: 'وېشنیزې', subtitle: 'اصلي وېشنیزه وټاکئ، فرعي وېشنیزې وګورئ او مستقیمو محصولاتو ته لاړ شئ.', back: 'بېرته کور ته', all: 'ټولې وېشنیزې', sub: 'فرعي وېشنیزې', products: 'محصولات', open: 'محصولات وګورئ', path: 'د انتخاب لاره', noSub: 'دا وېشنیزه تر اوسه فرعي وېشنیزه نه لري.' },
  en: { title: 'Categories', subtitle: 'Choose a main category, browse its subcategories, and jump straight to products.', back: 'Back to home', all: 'All categories', sub: 'Subcategories', products: 'products', open: 'View products', path: 'Selection path', noSub: 'This category does not have subcategories yet.' },
} as const;

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ parent?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const lang = locale === 'en' || locale === 'ps' ? locale : 'fa';
  return { title: copy[lang].title, description: copy[lang].subtitle };
}

export default async function CategoriesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { parent = '' } = await searchParams;
  setRequestLocale(locale);
  const lang = locale === 'en' || locale === 'ps' ? locale : 'fa';
  const t = copy[lang];
  const categories = await getCategoryRepository().findAll(true, true).catch(() => []);
  const roots = categories.filter((category) => !category.parentId);
  const selectedRoot = roots.find((category) => category.slug === parent) ?? null;
  const children = selectedRoot ? categories.filter((category) => category.parentId === selectedRoot.id) : [];
  const numberLocale = lang === 'en' ? 'en-US' : lang === 'ps' ? 'ps-AF' : 'fa-IR';

  const categoryImage = (category: (typeof categories)[number]) => category.imageUrl ?? '';
  const label = (category: (typeof categories)[number]) => names[lang][category.key] ?? category.name;

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main id="main" className="pb-20 md:pb-0">
        <div className="mx-auto max-w-screen-xl px-3 py-5 sm:px-6 sm:py-8">
          <header className="mb-6 overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
            <div className="relative p-5 sm:p-7">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/[0.08] to-transparent" />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-[11px] font-bold text-primary"><FolderTree className="h-3.5 w-3.5" aria-hidden />{t.all}</div>
                  <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{t.title}</h1>
                  <p className="mt-1.5 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">{t.subtitle}</p>
                </div>
                <Link href="/" className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-bold text-foreground transition hover:border-primary/30 hover:text-primary"><ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />{t.back}</Link>
              </div>
            </div>

            <div className="border-y border-border bg-muted/20 px-3 py-2.5 sm:px-4">
              <div className="flex min-w-max items-center gap-2 overflow-x-auto pb-0.5">
                <Link href="/categories" className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${!selectedRoot ? 'bg-primary text-primary-foreground shadow-sm' : 'border border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-primary'}`}>{t.all}</Link>
                {roots.map((root) => <Link key={root.id} href={`/categories?parent=${encodeURIComponent(root.slug)}`} className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${selectedRoot?.id === root.id ? 'bg-primary text-primary-foreground shadow-sm' : 'border border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-primary'}`}>{label(root)}</Link>)}
              </div>
            </div>

            {selectedRoot && (
              <div className="px-3 py-3 sm:px-4">
                <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold text-muted-foreground"><span>{t.path}</span><ChevronLeft className="h-3 w-3 rtl:rotate-180" aria-hidden /><span className="font-bold text-primary">{label(selectedRoot)}</span></div>
                <div className="flex min-w-max items-center gap-2 overflow-x-auto">
                  <Link href={`/category/${selectedRoot.slug}`} className="rounded-xl bg-primary/10 px-3 py-2 text-[11px] font-bold text-primary">{t.open}</Link>
                  {children.map((child) => <Link key={child.id} href={`/category/${child.slug}`} className="rounded-xl border border-border bg-background px-3 py-2 text-[11px] font-semibold text-foreground hover:border-primary/30 hover:text-primary">{label(child)}</Link>)}
                </div>
              </div>
            )}
          </header>

          {!selectedRoot ? (
            <section aria-labelledby="all-categories">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div><h2 id="all-categories" className="text-lg font-black">{t.all}</h2><p className="mt-1 text-xs text-muted-foreground">{roots.length.toLocaleString(numberLocale)} {t.all}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {roots.map((category) => (
                  <Link key={category.id} href={`/categories?parent=${encodeURIComponent(category.slug)}`} className="group relative min-h-36 overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
                    {categoryImage(category) ? <Image src={categoryImage(category)} alt={label(category)} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-muted to-muted" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-3.5 text-white"><h3 className="line-clamp-2 text-sm font-black leading-5">{label(category)}</h3><p className="mt-1 text-[10px] font-semibold text-white/75">{(category.productCount ?? 0).toLocaleString(numberLocale)} {t.products}</p><span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-white/90">{t.open}<ArrowUpRight className="h-3 w-3" aria-hidden /></span></div>
                  </Link>
                ))}
              </div>
            </section>
          ) : (
            <section aria-labelledby="selected-category">
              <div className="mb-5 flex items-start justify-between gap-3 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
                <div className="min-w-0"><div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" aria-hidden /><p className="text-[11px] font-bold text-primary">{t.path}</p></div><h2 id="selected-category" className="mt-1 text-xl font-black sm:text-2xl">{label(selectedRoot)}</h2><p className="mt-1 text-xs text-muted-foreground">{(selectedRoot.productCount ?? 0).toLocaleString(numberLocale)} {t.products}</p></div><Link href={`/category/${selectedRoot.slug}`} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2.5 text-[11px] font-bold text-primary-foreground shadow-sm hover:opacity-90">{t.open}<ArrowUpRight className="h-3.5 w-3.5" aria-hidden /></Link>
              </div>

              <div className="mb-4 flex items-end justify-between gap-3"><div><h3 className="text-lg font-black">{t.sub}</h3><p className="mt-1 text-xs text-muted-foreground">{children.length} {t.sub}</p></div></div>
              {children.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center"><Package className="mx-auto h-9 w-9 text-muted-foreground/40" aria-hidden /><p className="mt-3 text-sm font-semibold text-muted-foreground">{t.noSub}</p></div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {children.map((category) => (
                    <Link key={category.id} href={`/category/${category.slug}`} className="group min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
                      <div className="relative aspect-[4/3] overflow-hidden bg-muted">{categoryImage(category) ? <Image src={categoryImage(category)} alt={label(category)} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-muted"><Package className="h-7 w-7 text-primary/40" aria-hidden /></div>}</div>
                      <div className="p-3"><h4 className="line-clamp-2 min-h-9 text-xs font-black leading-5 group-hover:text-primary sm:text-sm">{label(category)}</h4><div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-muted-foreground"><span>{(category.productCount ?? 0).toLocaleString(numberLocale)} {t.products}</span><ArrowUpRight className="h-3 w-3 shrink-0" aria-hidden /></div></div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
      <BottomNavigation />
    </div>
  );
}
