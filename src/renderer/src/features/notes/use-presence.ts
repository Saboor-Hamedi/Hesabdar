import { useEffect, useRef, useState } from 'react';

/**
 * Drives the pop-in / peel-off animation with plain Tailwind classes.
 * `leave()` plays the exit, then calls `onGone` so the item can be removed.
 */
export function usePresence(onGone: () => void, exitMs = 220) {
  const [shown, setShown] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Two frames, so the browser has painted the "before" state first.
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setShown(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const leave = () => {
    if (leaving) return;
    setLeaving(true);
    timer.current = window.setTimeout(onGone, exitMs);
  };

  const stateClass = leaving
    ? 'scale-75 -translate-y-2 opacity-0'
    : shown
      ? 'scale-100 opacity-100'
      : 'scale-90 -translate-y-4 opacity-0';

  return { shown, leaving, stateClass, leave };
}
