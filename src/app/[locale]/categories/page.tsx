import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowLeft, ChevronLeft, LayoutGrid, Package, Sparkles } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { BottomNavigation } from '@/features/home/components/bottom-navigation';
import { getCategoryRepository, getProductService } from '@/server/infrastructure/registry';

const names: Record<string, Record<string, string>> = {
  fa: { clothing: 'پوشاک', digital: 'موبایل و دیجیتال', homeAppliances: 'خانه و آشپزخانه', beauty: 'بهداشت و زیبایی', sports: 'ورزش', footwear: 'کفش و کیف', baby: 'کودک و نوزاد', books: 'کتاب و آموزش', electronics: 'لوازم الکترونیکی', watches: 'ساعت و اکسسوری' },
  ps: { clothing: 'جامې', digital: 'موبایل او ډیجیټل', homeAppliances: 'کور او پخلنځی', beauty: 'روغتیا او ښکلا', sports: 'ورزش', footwear: 'بوټان او بکسونه', baby: 'ماشومان', books: 'کتابونه او زده کړه', electronics: 'برېښنایي وسایل', watches: 'ساعتونه او لوازم' },
  en: { clothing: 'Clothing', digital: 'Mobile & Digital', homeAppliances: 'Home & Kitchen', beauty: 'Beauty & Care', sports: 'Sports', footwear: 'Footwear & Bags', baby: 'Baby & Kids', books: 'Books & Learning', electronics: 'Electronics', watches: 'Watches & Accessories' },
};

const copy = {
  fa: { title: 'دسته‌بندی‌ها', subtitle: 'دسته اصلی را انتخاب کنید، زیر‌دسته را ببینید و مستقیم وارد محصولات شوید.', back: 'بازگشت به خانه', count: 'محصول', all: 'همه دسته‌ها', popular: 'دسته‌های اصلی', sub: 'زیر‌دسته‌ها', allProducts: 'همه محصولات این دسته', breadcrumb: 'مسیر انتخاب' },
  ps: { title: 'وېشنیزې', subtitle: 'اصلي وېشنیزه وټاکئ، فرعي وېشنیزې وګورئ او مستقیم محصولاتو ته لاړ شئ.', back: 'بېرته کور ته', count: 'محصولات', all: 'ټولې وېشنیزې', popular: 'اصلي وېشنیزې', sub: 'فرعي وېشنیزې', allProducts: 'د دې وېشنیزې ټول محصولات', breadcrumb: 'د انتخاب لاره' },
  en: { title: 'Categories', subtitle: 'Choose a main category, browse its subcategories, and jump straight to products.', back: 'Back to home', count: 'products', all: 'All categories', popular: 'Main categories', sub: 'Subcategories', allProducts: 'All products in this category', breadcrumb: 'Selection path' },
} as const;

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ parent?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const lang = locale === 'en' || locale === 'ps' ? locale : 'fa';
  return { title: copy[lang].title, description: copy[lang].subtitle };
}

export default async function CategoriesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);
  const lang = locale === 'en' || locale === 'ps' ? locale : 'fa';

  const raw = await getCategoryRepository().findAll(true, true).catch(() => []);
  const productService = getProductService();
  const categories = await Promise.all(raw.map(async (category) => {
    const preview = await productService.listProducts({ categoryKey: category.key, page: 1, pageSize: 1, sort: 'popular', isActive: true }).catch(() => ({ products: [] }));
    return {
      ...category,
      title: names[lang][category.key] ?? category.name,
      image: category.imageUrl ?? preview.products[0]?.images?.find((image) => image.src)?.src ?? '',
    };
  }));

  const roots = categories.filter((category) => !category.parentId);
  const selectedRoot = roots.find((category) => category.slug === query.parent) ?? roots[0] ?? null;
  const children = selectedRoot ? categories.filter((category) => category.parentId === selectedRoot.id) : [];

  const Card = ({ category, featured = false }: { category: (typeof categories)[number]; featured?: boolean }) => <Link href={featured ? `/categories?parent=${encodeURIComponent(category.slug)}` : `/category/${category.slug}`} className={`group relative flex min-w-0 overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${featured ? 'min-h-40 flex-col justify-end p-4 sm:min-h-48' : 'items-center gap-3 p-3 sm:p-3.5'}`}>
    <div className={`relative shrink-0 overflow-hidden bg-muted ${featured ? 'absolute inset-0' : 'h-14 w-14 rounded-xl sm:h-16 sm:w-16'}`}>{category.image ? <Image src={category.image} alt={category.title} fill sizes={featured ? '(max-width: 640px) 50vw, 25vw' : '64px'} loading={featured ? 'lazy' : 'lazy'} className="object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="flex h-full w-full items-center justify-center text-primary/40"><Package className="h-6 w-6" aria-hidden /></div>}{featured && <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />}</div>
    <div className={`min-w-0 ${featured ? 'relative z-10 text-white' : 'flex-1'}`}><h2 className={`line-clamp-2 font-black leading-5 ${featured ? 'text-base' : 'text-sm group-hover:text-primary sm:text-[15px]'}`}>{category.title}</h2><p className={`mt-1 text-[11px] font-semibold ${featured ? 'text-white/75' : 'text-muted-foreground'}`}>{(category.productCount ?? 0).toLocaleString(lang === 'en' ? 'en-US' : lang === 'ps' ? 'ps-AF' : 'fa-IR')} {copy[lang].count}</p>{!featured && <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-primary">{copy[lang].allProducts}<ChevronLeft className="h-3 w-3 rtl:rotate-180" /></span>}</div>
  </Link>;

  return <div className="min-h-dvh bg-background"><SiteHeader /><main id="main" className="pb-20 md:pb-0"><div className="mx-auto max-w-screen-xl px-3 py-5 sm:px-6 sm:py-8">
    <div className="mb-5 flex items-center gap-3"><Link href="/" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:border-primary/30 hover:text-primary" aria-label={copy[lang].back}><ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden /></Link><div className="min-w-0"><h1 className="text-2xl font-black tracking-tight sm:text-3xl">{copy[lang].title}</h1><p className="mt-1 text-xs leading-6 text-muted-foreground sm:text-sm">{copy[lang].subtitle}</p></div></div>

    <section className="mb-6 overflow-hidden rounded-3xl border border-border bg-card shadow-sm" aria-label={copy[lang].all}>
      <div className="border-b border-border bg-muted/30 px-4 py-3 sm:px-5"><div className="flex items-center gap-2"><LayoutGrid className="h-4 w-4 text-primary" /><span className="text-xs font-black uppercase tracking-wide text-muted-foreground">{copy[lang].all}</span><span className="ms-auto text-xs font-bold text-foreground">{categories.length}</span></div></div>
      <div className="border-b border-border px-3 py-2.5 sm:px-4"><div className="flex min-w-max items-center gap-2 overflow-x-auto pb-1">{roots.map((root) => <Link key={root.id} href={`/categories?parent=${encodeURIComponent(root.slug)}`} className={`rounded-full px-3 py-2 text-xs font-bold transition ${selectedRoot?.id === root.id ? 'bg-primary text-primary-foreground shadow-sm' : 'border border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-primary'}`}>{root.title}</Link>)}</div></div>
      <div className="px-3 py-3 sm:px-4"><div className="mb-2 flex items-center gap-2 text-xs font-bold text-muted-foreground"><span>{copy[lang].breadcrumb}:</span><span className="text-foreground">{copy[lang].all}</span>{selectedRoot ? <><span>/</span><span className="text-primary">{selectedRoot.title}</span></> : null}</div><div className="flex min-w-max items-center gap-2 overflow-x-auto">{selectedRoot ? <><Link href={`/category/${selectedRoot.slug}`} className="rounded-xl bg-primary/10 px-3 py-2 text-xs font-bold text-primary">{copy[lang].allProducts}</Link>{children.map((child) => <Link key={child.id} href={`/category/${child.slug}`} className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:border-primary/30 hover:text-primary">{child.title}</Link>)}</> : <span className="text-xs text-muted-foreground">{copy[lang].all}</span>}</div></div>
    </section>

    {selectedRoot && <section aria-labelledby="main-category" className="mb-8"><div className="mb-4 flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" aria-hidden /><h2 id="main-category" className="text-lg font-black">{copy[lang].popular}</h2></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Card category={selectedRoot} featured />{children.slice(0, 3).map((category) => <Card key={category.id} category={category} featured />)}</div></section>}

    <section aria-labelledby="all-categories"><div className="mb-4 flex items-end justify-between gap-3"><h2 id="all-categories" className="text-lg font-black">{children.length > 0 ? copy[lang].sub : copy[lang].all}</h2><span className="text-xs font-semibold text-muted-foreground">{children.length > 0 ? children.length : roots.length} {copy[lang].count}</span></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{(children.length > 0 ? children : roots).map((category) => <Card key={category.id} category={category} />)}</div></section>
  </div></main><SiteFooter /><BottomNavigation /></div>;
}
