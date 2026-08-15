import * as React from 'react';
import { getDirection, htmlLangFor } from '@/lib/direction';
import type { AppLocale } from '@/i18n/routing';

interface DirectionProviderProps {
  locale: AppLocale;
  children: React.ReactNode;
}

/**
 * Server component — wraps the page in a dir/lang container.
 *
 * Uses semantic CSS custom-property classes (bg-background, text-foreground)
 * so dark mode tokens from globals.css propagate automatically.
 *
 * NOTE: Dark mode is driven by the `dark` class on <html>, applied by
 * the anti-flicker inline script + ThemeProvider in the locale layout.
 * This component does NOT need to manage the class itself.
 */
export function DirectionProvider({ locale, children }: DirectionProviderProps) {
  const dir = getDirection(locale);
  const lang = htmlLangFor(locale);

  return (
    <div lang={lang} dir={dir} className="min-h-dvh bg-background text-foreground">
      {children}
    </div>
  );
}
