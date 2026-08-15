/**
 * The 34 provinces of Afghanistan — bilingual (English + Dari/Pashto).
 *
 * `DEFAULT_PROVINCE` is exported so any form that needs a sensible starting
 * value can import it without hardcoding the string. When business requirements
 * change, updating this one constant propagates everywhere.
 *
 * To add a new province in the future:
 *   1. Add an entry to `AFGHAN_PROVINCES` (must match Prisma enum if used there).
 *   2. Add a Dari label to `AFGHAN_PROVINCES_DARI`.
 *   3. Done — all forms and selects pick it up automatically.
 */

export const AFGHAN_PROVINCES = [
  'Badakhshan',
  'Badghis',
  'Baghlan',
  'Balkh',
  'Bamyan',
  'Daykundi',
  'Farah',
  'Faryab',
  'Ghazni',
  'Ghor',
  'Helmand',
  'Herat',
  'Jowzjan',
  'Kabul',
  'Kandahar',
  'Kapisa',
  'Khost',
  'Kunar',
  'Kunduz',
  'Laghman',
  'Logar',
  'Nangarhar',
  'Nimroz',
  'Nuristan',
  'Paktia',
  'Paktika',
  'Panjshir',
  'Parwan',
  'Samangan',
  'Sar-e Pol',
  'Takhar',
  'Uruzgan',
  'Wardak',
  'Zabul',
] as const;

export type AfghanProvince = (typeof AFGHAN_PROVINCES)[number];

/**
 * Default province for new orders and shipping forms.
 * Kabul is the capital and the most common delivery destination.
 * Change this constant to update the default everywhere at once.
 */
export const DEFAULT_PROVINCE: AfghanProvince = 'Kabul';

/**
 * Dari / Farsi display labels for each province.
 * Used in select dropdowns when locale is `fa` or `ps`.
 */
export const AFGHAN_PROVINCES_DARI: Record<AfghanProvince, string> = {
  Badakhshan: 'بدخشان',
  Badghis:    'بادغیس',
  Baghlan:    'بغلان',
  Balkh:      'بلخ',
  Bamyan:     'بامیان',
  Daykundi:   'دایکندی',
  Farah:      'فراه',
  Faryab:     'فاریاب',
  Ghazni:     'غزنی',
  Ghor:       'غور',
  Helmand:    'هلمند',
  Herat:      'هرات',
  Jowzjan:    'جوزجان',
  Kabul:      'کابل',
  Kandahar:   'قندهار',
  Kapisa:     'کاپیسا',
  Khost:      'خوست',
  Kunar:      'کنر',
  Kunduz:     'کندز',
  Laghman:    'لغمان',
  Logar:      'لوگر',
  Nangarhar:  'ننگرهار',
  Nimroz:     'نیمروز',
  Nuristan:   'نورستان',
  Paktia:     'پکتیا',
  Paktika:    'پکتیکا',
  Panjshir:   'پنجشیر',
  Parwan:     'پروان',
  Samangan:   'سمنگان',
  'Sar-e Pol':'سرپل',
  Takhar:     'تخار',
  Uruzgan:    'ارزگان',
  Wardak:     'وردک',
  Zabul:      'زابل',
};

export function isAfghanProvince(value: string): value is AfghanProvince {
  return (AFGHAN_PROVINCES as readonly string[]).includes(value);
}

/**
 * Returns the display label for a province in the given locale.
 * Falls back to the English name for unknown locales.
 */
export function getProvinceLabel(province: AfghanProvince, locale: string): string {
  if (locale === 'fa' || locale === 'ps') {
    return AFGHAN_PROVINCES_DARI[province] ?? province;
  }
  return province;
}
