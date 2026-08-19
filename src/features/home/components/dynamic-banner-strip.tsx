import Link from 'next/link';
import Image from 'next/image';
import { listActiveBanners, type BannerRow } from '@/server/services/banner.service';

function BannerCard({ banner, locale }: { banner: BannerRow; locale: string }) {
  const content = (
    <div className="group relative overflow-hidden rounded-3xl border border-border bg-card shadow-premium">
      <picture>
        {banner.mobileImageUrl ? <source media="(max-width: 767px)" srcSet={banner.mobileImageUrl} /> : null}
        <Image
          src={banner.desktopImageUrl}
          alt={banner.title ?? 'Eshop'}
          width={1600}
          height={520}
          className="h-auto min-h-[180px] w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
          sizes="100vw"
          priority={banner.placement === 'hero'}
        />
      </picture>
      {(banner.title || banner.subtitle || banner.ctaLabel) && (
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/65 via-black/10 to-transparent p-5 sm:p-8" dir={locale === 'en' ? 'ltr' : 'rtl'}>
          <div className="max-w-xl text-white">
            {banner.title ? <h2 className="text-xl font-black sm:text-3xl">{banner.title}</h2> : null}
            {banner.subtitle ? <p className="mt-1.5 max-w-lg text-xs leading-6 text-white/85 sm:text-sm">{banner.subtitle}</p> : null}
            {banner.ctaLabel ? <span className="mt-3 inline-flex rounded-xl bg-white px-4 py-2 text-xs font-extrabold text-slate-900">{banner.ctaLabel}</span> : null}
          </div>
        </div>
      )}
    </div>
  );

  return banner.href ? <Link href={banner.href} aria-label={banner.title ?? 'Eshop'}>{content}</Link> : content;
}

export async function DynamicBannerStrip({ locale, placement = 'hero' }: { locale: string; placement?: string }) {
  const banners = await listActiveBanners(placement, 6);
  if (banners.length === 0) return null;
  return (
    <section className="mx-auto max-w-screen-xl px-3 py-3 sm:px-6 sm:py-5" aria-label="Eshop banners">
      <div className="grid gap-4 lg:grid-cols-1">
        {banners.map((banner) => <BannerCard key={banner.id} banner={banner} locale={locale} />)}
      </div>
    </section>
  );
}
