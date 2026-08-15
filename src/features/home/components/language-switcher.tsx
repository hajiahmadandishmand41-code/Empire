'use client';

import * as React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { Globe, Check, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const LOCALES = [
  { code: 'fa', label: 'دری' },
  { code: 'ps', label: 'پښتو' },
  { code: 'en', label: 'English' },
] as const;

interface LanguageSwitcherProps {
  variant?: 'icon' | 'full';
  className?: string;
}

export function LanguageSwitcher({ variant = 'icon', className }: LanguageSwitcherProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('mobileMenu');
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  function change(code: string) {
    // Read the query string lazily from the browser instead of
    // `useSearchParams()`: calling that hook during render forces the whole
    // page tree to bail out of static/server rendering
    // (BAILOUT_TO_CLIENT_SIDE_RENDERING), which left the prerendered HTML
    // empty and the storefront stuck on the loading screen.
    const query = typeof window === 'undefined' ? '' : window.location.search.replace(/^\?/, '');
    const href = query ? `${pathname}?${query}` : pathname;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- next-intl router types do not expose href overload
    router.replace(href as any, { locale: code as any });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('language')}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-xl border transition-colors',
          'border-border bg-background text-foreground',
          'px-2.5 text-xs font-medium shadow-sm',
          'hover:bg-muted hover:text-rose-600 dark:hover:text-rose-400',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className,
        )}
      >
        <Globe className="h-4 w-4" aria-hidden />
        {variant === 'full' ? (
          <>
            <span>{current.label}</span>
            <ChevronDown className="h-3 w-3 opacity-60" aria-hidden />
          </>
        ) : (
          <span className="hidden sm:inline">{current.label}</span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[10rem]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {t('language')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => change(l.code)}
            className="flex items-center justify-between gap-2 text-sm cursor-pointer"
          >
            <span>{l.label}</span>
            {l.code === locale && <Check className="h-4 w-4 text-rose-500" aria-hidden />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
