'use client';

/**
 * ThemeProvider — production-level light/dark mode implementation.
 *
 * Features:
 * - Supports explicit 'light' | 'dark' | 'system' modes.
 * - Persists to localStorage under key 'empire-theme'.
 * - Defaults to LIGHT when no preference exists.
 * - The initial hydration effect reads the persisted preference before the
 *   normal theme-sync effect is allowed to run, avoiding a light/dark flip.
 * - Reacts to OS-level color-scheme changes only when the user explicitly
 *   selected 'system'.
 */

import * as React from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'empire-theme';
const DEFAULT_THEME: ThemeMode = 'light';

interface ThemeContextValue {
  /** User-selected theme (may be 'system'). */
  theme: ThemeMode;
  /** Actual applied theme ('light' | 'dark'). */
  resolvedTheme: ResolvedTheme;
  /** Change the active theme and persist it. */
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === 'system' ? getSystemTheme() : mode;
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.setAttribute('data-theme', resolved);
}

interface ThemeProviderProps {
  children: React.ReactNode;
  /** SSR default. No stored preference means light. */
  defaultTheme?: ThemeMode;
}

export function ThemeProvider({ children, defaultTheme = DEFAULT_THEME }: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<ThemeMode>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>('light');
  const initializedRef = React.useRef(false);

  // First client pass: load the persisted choice and apply it immediately.
  // This effect must run before the normal [theme] synchronization effect so
  // a stored dark theme is never overwritten by the SSR light default.
  React.useEffect(() => {
    let stored: ThemeMode = DEFAULT_THEME;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === 'light' || raw === 'dark' || raw === 'system') {
        stored = raw;
      }
    } catch {
      // localStorage unavailable (private mode, storage policy, etc.).
    }

    const resolved = resolveTheme(stored);
    setThemeState(stored);
    setResolvedTheme(resolved);
    applyTheme(resolved);
    initializedRef.current = true;
  }, []);

  // Subsequent changes are driven by the explicit user selection.
  React.useEffect(() => {
    if (!initializedRef.current) return;
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, [theme]);

  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    function onSystemChange() {
      if (theme !== 'system') return;
      const resolved = getSystemTheme();
      setResolvedTheme(resolved);
      applyTheme(resolved);
    }

    if (mq.addEventListener) {
      mq.addEventListener('change', onSystemChange);
      return () => mq.removeEventListener('change', onSystemChange);
    }
    mq.addListener(onSystemChange);
    return () => mq.removeListener(onSystemChange);
  }, [theme]);

  const setTheme = React.useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Ignore storage failures; the current tab still changes theme.
    }
    const resolved = resolveTheme(mode);
    setResolvedTheme(resolved);
    applyTheme(resolved);
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
