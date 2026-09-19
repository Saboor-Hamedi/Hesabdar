import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import type { Theme } from './tokens';
import {
  STORAGE_KEY,
  applyTheme,
  getStoredTheme,
  getSystemTheme,
  injectThemeStyles,
  parseTheme,
  storeTheme,
  withThemeTransition,
  type Point,
} from './theme';

export interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  /** Set a theme. `origin` is where the reveal animation starts (viewport px). */
  setTheme: (theme: Theme, origin?: Point) => void;
  toggleTheme: (origin?: Point) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

injectThemeStyles();

function resolveInitialTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  // The init script may already have decided.
  return (
    parseTheme(document.documentElement.dataset.theme ?? null) ??
    getStoredTheme() ??
    getSystemTheme()
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(resolveInitialTheme);

  // Keep the DOM in step with state.
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Follow the OS until the user makes a choice.
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) => {
      if (getStoredTheme() === null) setThemeState(event.matches ? 'dark' : 'light');
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  // Keep other tabs in sync.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      setThemeState(parseTheme(event.newValue) ?? getSystemTheme());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setTheme = useCallback((next: Theme, origin?: Point) => {
    storeTheme(next);
    withThemeTransition(() => {
      // flushSync so React has rendered before the browser snapshots the new view.
      flushSync(() => setThemeState(next));
      applyTheme(next);
    }, origin);
  }, []);

  const toggleTheme = useCallback(
    (origin?: Point) => setTheme(theme === 'dark' ? 'light' : 'dark', origin),
    [theme, setTheme],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, isDark: theme === 'dark', setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>');
  return context;
}
