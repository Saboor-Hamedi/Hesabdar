import type { CSSProperties, MouseEvent } from 'react';
import { useTheme } from './ThemeProvider';
import './theme-toggle.css';

export interface ThemeToggleProps {
  /** Size of the switch as a CSS length. The default is 16px (a 72×36px switch). */
  size?: string;
  className?: string;
}

/** Position and timing (em, ms, s) for the night-sky stars. */
const STARS = [
  { x: 0.35, y: 0.45, s: 0.22, delay: 0, twinkle: 3.1 },
  { x: 0.95, y: 1.45, s: 0.16, delay: 110, twinkle: 2.4 },
  { x: 1.25, y: 0.38, s: 0.28, delay: 210, twinkle: 3.8 },
  { x: 1.85, y: 1.2, s: 0.2, delay: 320, twinkle: 2.9 },
  { x: 0.55, y: 1.62, s: 0.13, delay: 430, twinkle: 3.5 },
  { x: 2.3, y: 0.55, s: 0.15, delay: 520, twinkle: 2.6 },
] as const;

const RAYS = Array.from({ length: 8 }, (_, i) => i);

type Vars = CSSProperties & Record<`--${string}`, string | number>;

export function ThemeToggle({ size, className }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    toggleTheme({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  };

  const style: Vars | undefined = size ? { '--toggle-size': size } : undefined;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Dark mode"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      data-state={isDark ? 'night' : 'day'}
      className={['theme-toggle', className].filter(Boolean).join(' ')}
      style={style}
      onClick={handleClick}
    >
      <span className="theme-toggle__track" aria-hidden="true">
        <span className="theme-toggle__sky theme-toggle__sky--day" />
        <span className="theme-toggle__sky theme-toggle__sky--night" />

        <span className="theme-toggle__stars">
          {STARS.map((star, i) => (
            <span
              key={i}
              className="theme-toggle__star"
              style={
                {
                  '--x': `${star.x}em`,
                  '--y': `${star.y}em`,
                  '--s': `${star.s}em`,
                  '--delay': `${star.delay}ms`,
                  '--twinkle': `${star.twinkle}s`,
                } as Vars
              }
            />
          ))}
        </span>

        <span className="theme-toggle__clouds">
          <span className="theme-toggle__cloud theme-toggle__cloud--back" />
          <span className="theme-toggle__cloud theme-toggle__cloud--mid" />
          <span className="theme-toggle__cloud theme-toggle__cloud--front" />
        </span>

        <span className="theme-toggle__orb">
          <span className="theme-toggle__orb-inner">
            <span className="theme-toggle__rays">
              {RAYS.map((i) => (
                <span key={i} className="theme-toggle__ray" style={{ '--i': i } as Vars} />
              ))}
            </span>
            <span className="theme-toggle__body">
              <span className="theme-toggle__face theme-toggle__face--sun" />
              <span className="theme-toggle__face theme-toggle__face--moon">
                <span className="theme-toggle__crater theme-toggle__crater--a" />
                <span className="theme-toggle__crater theme-toggle__crater--b" />
                <span className="theme-toggle__crater theme-toggle__crater--c" />
              </span>
            </span>
          </span>
        </span>
      </span>
    </button>
  );
}
