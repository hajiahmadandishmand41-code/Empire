import { notFound } from 'next/navigation';
import { getLocale, setRequestLocale } from 'next-intl/server';
import { Store, MapPin, Phone, Mail, Package } from 'lucide-react';
import { SiteHeader } from '@/features/home/components/site-header';
import { SiteFooter } from '@/features/home/components/site-footer';
import { ShopProductCard } from '@/features/shop/components/shop-product-card';
import { Container } from '@/components/layout/container';
import { getProductService } from '@/server/infrastructure/registry';
import { getSellerRepository } from '@/server/infrastructure/registry';

export const dynamic = 'force-dynamic';

export default async function StorePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const [seller, result] = await Promise.all([
    getSellerRepository().findPublicProfile(id),
    getProductService().listProducts({ sellerId: id, page: 1, pageSize: 100, sort: 'newest' }),
  ]);
  if (!seller) notFound();

  return (
    <>
      <SiteHeader />
      <main id="main" className="min-h-dvh bg-background">
        <Container size="xl" className="py-6 sm:py-10">
          <section className="relative overflow-hidden rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-700 via-rose-800 to-slate-950 p-6 text-white shadow-lg sm:p-10">
            <div className="absolute -end-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" aria-hidden />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/15 ring-1 ring-white/30">
                {seller.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={seller.logoUrl} alt={seller.shopName ?? 'فروشگاه'} className="h-full w-full object-cover" />
                ) : (
                  <Store className="h-9 w-9 text-white" aria-hidden />
                )}
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-xs font-semibold text-rose-100">فروشگاه تأییدشده Empire Shop</p>
                <h1 className="text-2xl font-extrabold sm:text-3xl">{seller.shopName ?? 'فروشگاه فروشنده'}</h1>
                {seller.bio && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-rose-50/85">{seller.bio}</p>}
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-rose-50/90">
                  <span className="inline-flex items-center gap-1.5"><Package className="h-3.5 w-3.5" /> {seller.productCount} محصول</span>
                  {seller.city && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {seller.city}</span>}
                  {seller.contactPhone && <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {seller.contactPhone}</span>}
                  {seller.contactEmail && <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {seller.contactEmail}</span>}
                </div>
              </div>
            </div>
          </section>

          <div className="mt-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-rose-600">مجموعهٔ این فروشگاه</p>
              <h2 className="mt-1 text-xl font-extrabold text-foreground">همه محصولات</h2>
            </div>
            <span className="text-sm text-muted-foreground">{result.total.toLocaleString('fa-AF')} محصول</span>
          </div>

          {result.products.length > 0 ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {result.products.map((product) => (
                <ShopProductCard key={product.id} product={product} locale={locale} currency="AFN" />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
              این فروشگاه هنوز محصول فعالی ثبت نکرده است.
            </div>
          )}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}