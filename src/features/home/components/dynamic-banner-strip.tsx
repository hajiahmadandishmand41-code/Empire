import { listActiveBanners, type BannerRow } from '@/server/services/banner.service';
import { HomepageHeroCarousel, type CampaignBanner } from './homepage-hero-carousel';

function toCampaignBanner(banner: BannerRow): CampaignBanner {
  return {
    id: banner.id,
    title: banner.title,
    subtitle: banner.subtitle,
    ctaLabel: banner.ctaLabel,
    href: banner.href,
    desktopImageUrl: banner.desktopImageUrl,
    mobileImageUrl: banner.mobileImageUrl,
    autoSlide: banner.autoSlide,
    durationMs: banner.durationMs,
  };
}

export async function DynamicBannerStrip({ locale, placement = 'hero' }: { locale: string; placement?: string }) {
  const banners = await listActiveBanners(placement, 6);
  if (banners.length === 0) return null;
  return <HomepageHeroCarousel banners={banners.map(toCampaignBanner)} locale={locale} />;
}
