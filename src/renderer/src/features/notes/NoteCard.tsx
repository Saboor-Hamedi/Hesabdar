import { memo, useEffect, useRef, type CSSProperties, type RefObject } from 'react';
import { NOTE_COLORS, NOTE_COLOR_ORDER } from './colors';
import { cn } from './cn';
import { NOTE_SIZE, type NoteColor, type NoteItem } from './types';
import { useDrag } from './use-drag';
import { usePresence } from './use-presence';

interface NoteCardProps {
  item: NoteItem;
  boundsRef: RefObject<HTMLElement | null>;
  autoFocus: boolean;
  onText: (id: string, text: string) => void;
  onColor: (id: string, color: NoteColor) => void;
  onMove: (id: string, x: number, y: number) => void;
  onRaise: (id: string) => void;
  onRemove: (id: string) => void;
}

const FOLD = 22;

export const NoteCard = memo(function NoteCard({
  item,
  boundsRef,
  autoFocus,
  onText,
  onColor,
  onMove,
  onRaise,
  onRemove,
}: NoteCardProps) {
  const palette = NOTE_COLORS[item.color];
  const textRef = useRef<HTMLTextAreaElement>(null);

  const { shown, leaving, stateClass, leave } = usePresence(() => onRemove(item.id));
  const { dragging, dragProps, onHandleKeyDown } = useDrag({
    x: item.x,
    y: item.y,
    width: NOTE_SIZE,
    height: NOTE_SIZE,
    boundsRef,
    onMove: (x, y) => onMove(item.id, x, y),
  });

  useEffect(() => {
    if (autoFocus) textRef.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  return (
    <div
      className="group absolute left-0 top-0 touch-none"
      style={{
        width: NOTE_SIZE,
        height: NOTE_SIZE,
        zIndex: item.z,
        transform: `translate3d(${item.x}px, ${item.y}px, 0)`,
      }}
      onPointerDownCapture={() => onRaise(item.id)}
      {...dragProps}
    >
      {/* Tilt + soft shadow. Straightens when picked up. */}
      <div
        style={{ '--r': `${item.rotate}deg` } as CSSProperties}
        className={cn(
          'relative h-full w-full transition-[transform,filter] duration-200',
          dragging
            ? 'rotate-0 [filter:drop-shadow(0_20px_16px_rgba(0,0,0,0.38))]'
            : 'rotate-[var(--r)] [filter:drop-shadow(0_6px_5px_rgba(0,0,0,0.3))] group-hover:[filter:drop-shadow(0_12px_10px_rgba(0,0,0,0.34))]',
        )}
      >
        {/* Pop-in / peel-off + lift */}
        <div
          className={cn(
            'h-full w-full transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none',
            dragging ? 'scale-[1.05] opacity-100' : stateClass,
            !dragging && shown && !leaving && 'group-hover:-translate-y-1',
          )}
        >
          {/* Paper, with the bottom-right corner folded */}
          <div
            className={cn(
              'relative flex h-full w-full select-none flex-col bg-gradient-to-b text-stone-800',
              palette.paper,
              dragging ? 'cursor-grabbing' : 'cursor-grab',
              '[clip-path:polygon(0_0,100%_0,100%_calc(100%_-_22px),calc(100%_-_22px)_100%,0_100%)]',
            )}
          >
            <div className="flex h-10 shrink-0 items-center justify-between px-3.5 pt-3">
              <button
                type="button"
                aria-label="Move note. Use the arrow keys."
                onKeyDown={onHandleKeyDown}
                className="-m-1 grid [cursor:inherit] grid-cols-3 gap-[3px] rounded p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-800/70"
              >
                {Array.from({ length: 6 }, (_, i) => (
                  <span key={i} className="h-[3px] w-[3px] rounded-full bg-stone-900/30" />
                ))}
              </button>

              <div
                data-no-drag
                className="flex items-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100"
              >
                {NOTE_COLOR_ORDER.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Change color to ${NOTE_COLORS[color].label}`}
                    aria-pressed={color === item.color}
                    title={NOTE_COLORS[color].label}
                    onClick={() => onColor(item.id, color)}
                    className={cn(
                      'h-3.5 w-3.5 rounded-full ring-1 ring-black/20 transition-transform hover:scale-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-stone-800',
                      NOTE_COLORS[color].swatch,
                      color === item.color && 'ring-2 ring-stone-800',
                    )}
                  />
                ))}
                <button
                  type="button"
                  aria-label="Delete note"
                  title="Delete"
                  onClick={leave}
                  className="ml-0.5 grid h-5 w-5 place-items-center rounded-full text-stone-800/70 transition-colors hover:bg-black/10 hover:text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-800"
                >
                  <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden="true">
                    <path
                      d="M2 2l8 8M10 2l-8 8"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 px-3.5 pb-5">
              <textarea
                ref={textRef}
                data-no-drag
                value={item.text}
                maxLength={600}
                placeholder="Write something…"
                aria-label="Note text"
                onChange={(event) => onText(item.id, event.target.value)}
                onFocus={() => onRaise(item.id)}
                className="h-full w-full cursor-text select-text resize-none bg-transparent font-hand text-[1.35rem] leading-[1.2] text-stone-800 placeholder:text-stone-800/40 focus:outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              />
            </div>

            <span
              aria-hidden="true"
              style={{ width: FOLD, height: FOLD }}
              className="pointer-events-none absolute bottom-0 right-0 bg-gradient-to-br from-black/25 to-black/5 [clip-path:polygon(0_0,100%_0,0_100%)]"
            />
          </div>
        </div>

        {/* Tape */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-2.5 left-1/2 h-6 w-[4.5rem] -translate-x-1/2 -rotate-2 bg-white/50 [clip-path:polygon(0_0,4%_15%,0_30%,4%_45%,0_60%,4%_75%,0_100%,100%_100%,96%_75%,100%_60%,96%_45%,100%_30%,96%_15%,100%_0)]"
        />
      </div>
    </div>
  );
});
