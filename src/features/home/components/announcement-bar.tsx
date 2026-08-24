import { BadgePercent, ShieldCheck, Truck } from 'lucide-react';

const messages = {
  fa: [
    { icon: Truck, text: 'ارسال داخل کابل با فروشندگان تأییدشده' },
    { icon: ShieldCheck, text: 'خرید امن و پیگیری سفارش تا تحویل' },
    { icon: BadgePercent, text: 'پیشنهادهای ویژه و قیمت‌های تازه هر روز' },
  ],
  ps: [
    { icon: Truck, text: 'په کابل کې د تایید شویو پلورونکو چټکه سپارنه' },
    { icon: ShieldCheck, text: 'خوندي پیرود او تر سپارلو پورې د فرمایش څارنه' },
    { icon: BadgePercent, text: 'هره ورځ ځانګړي وړاندیزونه او تازه بیې' },
  ],
  en: [
    { icon: Truck, text: 'Kabul delivery from verified sellers' },
    { icon: ShieldCheck, text: 'Secure checkout with order tracking' },
    { icon: BadgePercent, text: 'Fresh deals and special offers every day' },
  ],
} as const;

type Locale = keyof typeof messages;

export function AnnouncementBar({ locale }: { locale: string }) {
  const safeLocale: Locale = locale === 'en' || locale === 'ps' ? locale : 'fa';
  const items = messages[safeLocale];

  return (
    <div className="announcement-bar" role="status" aria-label={safeLocale === 'en' ? 'Store announcements' : safeLocale === 'ps' ? 'د پلورنځي اعلانونه' : 'اعلان‌های فروشگاه'}>
      <div className="announcement-track no-scrollbar">
        <div className="announcement-marquee" dir="ltr">
          {[...items, ...items].map(({ icon: Icon, text }, index) => (
            <span key={`${text}-${index}`} className="announcement-item" dir={safeLocale === 'en' ? 'ltr' : 'rtl'}>
              <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span>{text}</span>
            </span>
          ))}
        </div>
      </div>
      <style>{`
        .announcement-bar{overflow:hidden;border-bottom:1px solid hsl(var(--primary)/.12);background:linear-gradient(90deg,hsl(345 72% 97%),hsl(345 64% 94%));color:hsl(345 68% 28%);box-shadow:inset 0 -1px 0 hsl(var(--primary)/.04)}
        .announcement-track{overflow:hidden;width:100%;mask-image:linear-gradient(to right,transparent,black 4%,black 96%,transparent)}
        .announcement-marquee{display:flex;width:max-content;align-items:center;animation:empire-announcement 30s linear infinite;will-change:transform}
        .announcement-item{display:inline-flex;align-items:center;gap:.38rem;padding:.24rem 1.35rem;font-size:.62rem;font-weight:750;letter-spacing:.003em;white-space:nowrap}
        .announcement-item svg{color:hsl(var(--primary));}
        @keyframes empire-announcement{from{transform:translate3d(0,0,0)}to{transform:translate3d(-50%,0,0)}}
        html.dark .announcement-bar{border-bottom-color:hsl(var(--primary)/.16);background:linear-gradient(90deg,hsl(345 32% 15%),hsl(345 28% 12%));color:hsl(345 70% 88%)}
        html.dark .announcement-item svg{color:hsl(var(--primary));}
        @media (max-width:639px){.announcement-item{padding:.22rem .9rem;font-size:.56rem;gap:.34rem}.announcement-marquee{animation-duration:26s}}
        @media (prefers-reduced-motion:reduce){.announcement-marquee{animation:none;transform:none}.announcement-item:nth-child(n+2){display:none}}
      `}</style>
    </div>
  );
}
