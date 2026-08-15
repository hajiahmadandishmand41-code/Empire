import localFont from 'next/font/local';

/**
 * Self-hosted font registration via `next/font/local`.
 *
 * - Inter  → Latin scripts (English / numbers / punctuation)
 * - Vazirmatn → Persian / Arabic script (Dari, Pashto, Urdu)
 *
 * `display: swap` keeps FOUT minimal and gives instant text on slow networks.
 */

export const vazirmatn = localFont({
  src: [
    { path: '../../public/fonts/Vazirmatn-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/Vazirmatn-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../../public/fonts/Vazirmatn-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../../public/fonts/Vazirmatn-Bold.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-vazirmatn',
  preload: true,
});

export const inter = localFont({
  src: [
    { path: '../../public/fonts/Inter-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/Inter-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../../public/fonts/Inter-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../../public/fonts/Inter-Bold.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});
