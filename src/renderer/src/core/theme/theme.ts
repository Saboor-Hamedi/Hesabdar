import { tokens, type Theme, type ThemeTokens } from './tokens';

export const STORAGE_KEY = 'theme-preference';
const STYLE_ID = 'theme-tokens';

export interface Point {
  x: number;
  y: number;
}

/* ------------------------------------------------------------------ */
/* Stylesheet generated from tokens                                    */
/* ------------------------------------------------------------------ */

const kebab = (key: string): string =>
  key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

const declarations = (t: ThemeTokens): string =>
  Object.entries(t)
    .map(([key, value]) => `--${kebab(key)}:${value};`)
    .join('');

/**
 * CSS custom properties for both themes, built from `tokens`.
 * Produces --bg, --surface, --surface-muted, --text, --text-muted,
 * --border, --accent, --accent-contrast, --accent-soft and --shadow.
 */
export const themeStyleSheet = [
  `:root{color-scheme:light;${declarations(tokens.light)}}`,
  `:root[data-theme="dark"]{color-scheme:dark;${declarations(tokens.dark)}}`,
  // No-JS fallback: follow the OS until data-theme is set.
  `@media (prefers-color-scheme:dark){:root:not([data-theme]){color-scheme:dark;${declarations(tokens.dark)}}}`,
].join('\n');

export function injectThemeStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = themeStyleSheet;
  document.head.prepend(el);
}

/* ------------------------------------------------------------------ */
/* Reading and writing the preference                                  */
/* ------------------------------------------------------------------ */

const isTheme = (value: unknown): value is Theme =>
  value === 'light' || value === 'dark';

export function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('hesabdar_theme');
    return isTheme(value) ? value : null;
  } catch {
    return null; // storage blocked (private mode, sandboxed iframe…)
  }
}

export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
    localStorage.setItem('hesabdar_theme', theme);
  } catch {
    /* ignore */
  }
}

export function parseTheme(value: string | null): Theme | null {
  return isTheme(value) ? value : null;
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  root.classList.toggle('dark', theme === 'dark');
  root.style.removeProperty('background-color'); // set by the init script
  try {
    localStorage.setItem('hesabdar_theme', theme);
  } catch {}
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', tokens[theme].bg);
}

/**
 * Paste this into <head> as an inline script, before your CSS and bundle,
 * so the right theme is on the page before the first paint (no flash).
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  STORAGE_KEY,
)});if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}var r=document.documentElement;r.dataset.theme=t;r.style.colorScheme=t;r.style.backgroundColor=${JSON.stringify(
  { light: tokens.light.bg, dark: tokens.dark.bg },
)}[t]}catch(e){}})();`;

/* ------------------------------------------------------------------ */
/* Switching                                                           */
/* ------------------------------------------------------------------ */

/**
 * Runs `update` (which must change the theme synchronously) and, where the
 * browser supports it, reveals the new theme as a circle that grows out of
 * `origin` (usually the toggle button). Falls back to a short colour fade,
 * or nothing at all when the user prefers reduced motion.
 */
export function withThemeTransition(update: () => void, origin?: Point): void {
  const root = document.documentElement;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    update();
    return;
  }

  if (typeof document.startViewTransition !== 'function') {
    root.classList.add('theme-changing');
    update();
    window.setTimeout(() => root.classList.remove('theme-changing'), 500);
    return;
  }

  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? window.innerHeight / 2;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  const transition = document.startViewTransition(update);

  transition.ready
    .then(() => {
      root.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 700,
          easing: 'cubic-bezier(0.22, 0.8, 0.3, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    })
    .catch(() => {
      /* transition skipped, nothing to animate */
    });
}
