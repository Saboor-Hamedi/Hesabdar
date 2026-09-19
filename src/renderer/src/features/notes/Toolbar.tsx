import { memo, useEffect, useState } from 'react';
import { NOTE_COLORS, NOTE_COLOR_ORDER, STICKERS } from './colors';
import { cn } from './cn';
import type { NoteColor } from './types';

interface ToolbarProps {
  count: number;
  onAddNote: (color: NoteColor) => void;
  onAddSticker: (emoji: string) => void;
  onClear: () => void;
}

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-800';

export const Toolbar = memo(function Toolbar({
  count,
  onAddNote,
  onAddSticker,
  onClear,
}: ToolbarProps) {
  const [confirming, setConfirming] = useState(false);

  // The confirm state expires so a stray click never clears the board.
  useEffect(() => {
    if (!confirming) return;
    const id = window.setTimeout(() => setConfirming(false), 3000);
    return () => window.clearTimeout(id);
  }, [confirming]);

  useEffect(() => {
    if (count === 0) setConfirming(false);
  }, [count]);

  return (
    <div className="flex flex-wrap items-center gap-x-7 gap-y-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div role="group" aria-label="Add a note" className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">New note</span>
        <div className="flex items-center gap-2">
          {NOTE_COLOR_ORDER.map((color) => (
            <button
              key={color}
              type="button"
              title={`${NOTE_COLORS[color].label} note`}
              aria-label={`Add a ${NOTE_COLORS[color].label.toLowerCase()} note`}
              onClick={() => onAddNote(color)}
              className={cn(
                'h-7 w-7 rounded-[6px] bg-gradient-to-b shadow-sm ring-1 ring-black/10 transition duration-150 hover:-translate-y-0.5 hover:-rotate-6 hover:shadow-md active:scale-95',
                NOTE_COLORS[color].paper,
                focusRing,
              )}
            />
          ))}
        </div>
      </div>

      <div role="group" aria-label="Add a sticker" className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Stickers</span>
        <div className="flex items-center gap-0.5">
          {STICKERS.map(({ emoji, name }) => (
            <button
              key={emoji}
              type="button"
              title={`Add a ${name} sticker`}
              aria-label={`Add a ${name} sticker`}
              onClick={() => onAddSticker(emoji)}
              className={cn(
                'grid h-9 w-9 place-items-center rounded-lg text-xl transition duration-150 hover:scale-125 hover:-rotate-6 active:scale-95',
                focusRing,
              )}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <span className="text-sm tabular-nums text-slate-500 dark:text-slate-400">
          {count} {count === 1 ? 'item' : 'items'}
        </span>
        <button
          type="button"
          disabled={count === 0}
          onClick={() => {
            if (confirming) {
              setConfirming(false);
              onClear();
            } else {
              setConfirming(true);
            }
          }}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
            confirming
              ? 'bg-rose-600 text-white hover:bg-rose-700'
              : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700',
            focusRing,
          )}
        >
          {confirming ? 'Click again to clear' : 'Clear board'}
        </button>
      </div>
    </div>
  );
});
