'use client';

/**
 * ThemeToggle — reusable Dark Mode toggle button
 *
 * Variants:
 * - 'icon'     — compact icon-only button (Sun / Moon)
 * - 'dropdown' — full dropdown with Light / Dark / System options
 */

import * as React from 'react';
import { Sun, Moon, Monitor, Check, ChevronDown } from 'lucide-react';
import { useTheme, type ThemeMode } from '@/components/providers/theme-provider';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const MODES: { value: ThemeMode; labelFa: string; labelEn: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'light',  labelFa: 'روشن',   labelEn: 'Light',  icon: Sun },
  { value: 'dark',   labelFa: 'تاریک',  labelEn: 'Dark',   icon: Moon },
  { value: 'system', labelFa: 'سیستم',  labelEn: 'System', icon: Monitor },
];

interface ThemeToggleProps {
  /** 'icon' = single button that cycles theme | 'dropdown' = three-option menu */
  variant?: 'icon' | 'dropdown';
  className?: string;
  /** Language for labels ('fa' | 'ps' uses Dari/Pashto labels, anything else uses English) */
  lang?: string;
}

export function ThemeToggle({ variant = 'icon', className, lang = 'fa' }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isFarsi = lang === 'fa' || lang === 'ps';

  // The primary control is deliberately binary. System mode is available
  // only from the explicit appearance menu so one click never surprises the
  // user by changing again with the operating-system preference.
  function toggleTheme() {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }

  if (variant === 'icon') {
    const Icon = resolvedTheme === 'dark' ? Sun : Moon;
    const label = resolvedTheme === 'dark'
      ? (isFarsi ? 'حالت روشن' : 'Switch to Light')
      : (isFarsi ? 'حالت تاریک' : 'Switch to Dark');

    return (
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={toggleTheme}
        className={cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors',
          'border-border bg-background text-foreground',
          'hover:bg-muted hover:text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className,
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </button>
    );
  }

  // Dropdown variant
  const current = MODES.find((m) => m.value === theme) ?? MODES[2];
  const CurrentIcon = current.icon;
  const dropdownLabel = isFarsi ? 'حالت نمایش' : 'Appearance';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={dropdownLabel}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-medium transition-colors',
          'border-border bg-background text-foreground',
          'hover:bg-muted',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className,
        )}
      >
        <CurrentIcon className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">
          {isFarsi ? current.labelFa : current.labelEn}
        </span>
        <ChevronDown className="h-3 w-3 opacity-60" aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[10rem]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {dropdownLabel}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {MODES.map(({ value, labelFa, labelEn, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className="flex items-center justify-between gap-2 text-sm cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
              <span>{isFarsi ? labelFa : labelEn}</span>
            </span>
            {value === theme && <Check className="h-4 w-4 text-rose-500" aria-hidden />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
