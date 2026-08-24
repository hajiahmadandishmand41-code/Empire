import { Flame } from 'lucide-react';
import { getProductService } from '@/server/infrastructure/registry';
import { ProductSliderSection } from '@/features/home/components/product-slider-section';
import type { ProductSummary } from '@/types';

type Locale = 'fa' | 'ps' | 'en';

function toSliderProduct(product: ProductSummary) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    comparePrice: product.comparePrice,
    images: (product.images ?? []).map((image) => ({ url: image.src ?? '' })).filter((image) => Boolean(image.url)),
    badge: product.badge,
    rating: product.averageRating,
    reviewCount: product.reviewCount,
    salesCount: product.salesCount,
    viewCount: product.viewCount,
    categoryKey: product.categoryKey,
    sellerId: product.sellerId,
    sellerShopName: product.sellerShopName,
    sellerWhatsapp: product.sellerWhatsapp,
    region: product.region,
    inStock: product.inStock,
  };
}

export async function ShopHotProducts({ locale }: { locale: Locale }) {
  const [home, smart] = await Promise.all([
    getProductService().listProducts({ categoryKey: 'homeAppliances', isTraditional: false, sort: 'popular', page: 1, pageSize: 6, isActive: true }),
    getProductService().listProducts({ categoryKey: 'digital', isTraditional: false, sort: 'popular', page: 1, pageSize: 6, isActive: true }),
  ]);

  if (!home.products.length && !smart.products.length) return null;

  const copy = locale === 'en'
    ? { title: 'Hottest products', home: 'Home essentials', smart: 'Smart devices', sub: 'Popular picks from this category' }
    : locale === 'ps'
      ? { title: 'تر ټولو ګرم محصولات', home: 'د کور وسایل', smart: 'هوښیار وسایل', sub: 'د دې برخې مشهور انتخابونه' }
      : { title: 'داغ‌ترین محصولات', home: 'وسایل خانه', smart: 'وسایل هوشمند', sub: 'محبوب‌ترین انتخاب‌های این دسته' };

  const sectionHeading = (
    <div className="mx-auto flex max-w-screen-xl items-center gap-2 px-3 pb-2 pt-1 sm:px-6">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Flame className="h-4 w-4" aria-hidden="true" />
      </span>
      <div>
        <h2 className="text-sm font-black sm:text-base">{copy.title}</h2>
        <p className="text-[9px] text-muted-foreground sm:text-[11px]">{copy.sub}</p>
      </div>
    </div>
  );

  return (
    <section className="border-t border-border bg-background py-2 sm:py-4" aria-label={copy.title}>
      {sectionHeading}
      <div className="space-y-2 sm:space-y-3">
        {home.products.length ? (
          <ProductSliderSection
            title={copy.home}
            viewAllHref="/shop?categoryKey=homeAppliances&sort=popular"
            products={home.products.map(toSliderProduct)}
            locale={locale}
            accentColor="bg-emerald-500"
          />
        ) : null}
        {smart.products.length ? (
          <ProductSliderSection
            title={copy.smart}
            viewAllHref="/shop?categoryKey=digital&sort=popular"
            products={smart.products.map(toSliderProduct)}
            locale={locale}
            accentColor="bg-violet-500"
          />
        ) : null}
      </div>
    </section>
  );
}
