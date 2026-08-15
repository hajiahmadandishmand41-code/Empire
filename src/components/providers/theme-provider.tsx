'use client';

/**
 * ThemeProvider — Production-level Dark Mode implementation
 *
 * Features:
 * - Supports 'light' | 'dark' | 'system' modes
 * - Persists to localStorage under key 'empire-theme'
 * - Zero-flicker: an inline <script> in layout.tsx applies the class before paint
 * - Reacts to OS-level color scheme changes in 'system' mode
 * - Exposes useTheme() hook for consumers
 */

import * as React from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'empire-theme';
const DEFAULT_THEME: ThemeMode = 'system';

interface ThemeContextValue {
  /** User-selected theme (may be 'system') */
  theme: ThemeMode;
  /** Actual applied theme ('light' | 'dark') */
  resolvedTheme: ResolvedTheme;
  /** Change the active theme and persist it */
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') return getSystemTheme();
  return mode;
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
  }
}

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Override for SSR; defaults to reading localStorage on mount */
  defaultTheme?: ThemeMode;
}

export function ThemeProvider({ children, defaultTheme = DEFAULT_THEME }: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<ThemeMode>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>('light');

  // On mount: read persisted theme and sync DOM
  React.useEffect(() => {
    let stored: ThemeMode = DEFAULT_THEME;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === 'light' || raw === 'dark' || raw === 'system') {
        stored = raw;
      }
    } catch {
      // localStorage unavailable (private mode, etc.)
    }
    setThemeState(stored);
    const resolved = resolveTheme(stored);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);

  // Keep DOM in sync when theme state changes
  React.useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, [theme]);

  // Listen for OS-level color scheme changes (only relevant in 'system' mode)
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    function onSystemChange() {
      if (theme === 'system') {
        const resolved = getSystemTheme();
        setResolvedTheme(resolved);
        applyTheme(resolved);
      }
    }

    // Modern API
    if (mq.addEventListener) {
      mq.addEventListener('change', onSystemChange);
      return () => mq.removeEventListener('change', onSystemChange);
    }
    // Legacy API (Safari < 14)
    mq.addListener(onSystemChange);
    return () => mq.removeListener(onSystemChange);
  }, [theme]);

  const setTheme = React.useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Ignore
    }
  }, []);

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * useTheme — access theme state and the setTheme action.
 * Must be used inside <ThemeProvider>.
 */
export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return ctx;
}
