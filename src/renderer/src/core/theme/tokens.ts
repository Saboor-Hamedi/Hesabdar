export type Theme = 'light' | 'dark';

export interface ThemeTokens {
  /** Page background */
  bg: string;
  /** Cards, panels, inputs */
  surface: string;
  /** Hover fills, subtle wells */
  surfaceMuted: string;
  /** Primary text */
  text: string;
  /** Secondary text */
  textMuted: string;
  /** Hairlines and outlines */
  border: string;
  /** Brand / interactive colour */
  accent: string;
  /** Text or icon colour that sits on top of `accent` */
  accentContrast: string;
  /** Tinted background for accent-coloured highlights */
  accentSoft: string;
  /** Elevation shadow */
  shadow: string;
}

/**
 * "Daybreak" and "Nightfall".
 * Light is a cool morning-sky blue rather than plain white,
 * dark is deep indigo rather than neutral black, so the two
 * feel like the same place at different times of day.
 */
export const tokens = {
  light: {
    bg: '#EAF3FC',
    surface: '#FFFFFF',
    surfaceMuted: '#DCE9F7',
    text: '#0D1A2D',
    textMuted: '#4A5C75',
    border: '#C4D6EA',
    accent: '#F5A623',
    accentContrast: '#2A1A00',
    accentSoft: 'rgba(245, 166, 35, 0.16)',
    shadow: '0 18px 40px -22px rgba(24, 70, 120, 0.45)',
  },
  dark: {
    bg: '#090E22',
    surface: '#121A3A',
    surfaceMuted: '#1B2555',
    text: '#EAEEFF',
    textMuted: '#9BA7D4',
    border: '#2B3768',
    accent: '#A9BCFF',
    accentContrast: '#090E22',
    accentSoft: 'rgba(169, 188, 255, 0.16)',
    shadow: '0 18px 40px -22px rgba(0, 0, 12, 0.85)',
  },
} as const satisfies Record<Theme, ThemeTokens>;
