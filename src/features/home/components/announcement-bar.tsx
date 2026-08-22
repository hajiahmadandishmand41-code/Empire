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
        <div className="announcement-marquee">
          {[...items, ...items].map(({ icon: Icon, text }, index) => (
            <span key={`${text}-${index}`} className="announcement-item">
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{text}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
