import { memo, useEffect, useRef, type RefObject } from 'react';
import { NOTE_COLORS, NOTE_COLOR_ORDER } from './colors';
import { cn } from './cn';
import { NOTE_SIZE, type NoteColor, type NoteItem } from './types';
import { useDrag } from './use-drag';
import { usePresence } from './use-presence';

interface NoteCardProps {
  item: NoteItem;
  boundsRef: RefObject<HTMLElement | null>;
  autoFocus: boolean;
  size?: number;
  isGrid?: boolean;
  onTitle: (id: string, title: string) => void;
  onText: (id: string, text: string) => void;
  onColor: (id: string, color: NoteColor) => void;
  onMove: (id: string, x: number, y: number) => void;
  onRaise: (id: string) => void;
  onRemove: (id: string) => void;
}

export const NoteCard = memo(function NoteCard({
  item,
  boundsRef,
  autoFocus,
  size = NOTE_SIZE,
  isGrid = false,
  onTitle,
  onText,
  onColor,
  onMove,
  onRaise,
  onRemove,
}: NoteCardProps) {
  const palette = NOTE_COLORS[item.color] || NOTE_COLORS.butter;
  const textRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const { stateClass, leave } = usePresence(() => onRemove(item.id));
  const { dragging, dragProps, onHandleKeyDown } = useDrag({
    x: item.x,
    y: item.y,
    width: size,
    height: size,
    boundsRef,
    onMove: (x, y) => onMove(item.id, x, y),
  });

  useEffect(() => {
    if (!autoFocus) return;
    const timer = window.setTimeout(() => {
      titleRef.current?.focus({ preventScroll: true });
    }, 30);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus]); // ← DO NOT add item.title here — that re-runs on every keystroke and steals focus

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    onRaise(item.id);
    if (!isGrid) {
      dragProps.onPointerDown(e);
    }
  };

  const cardStyle: React.CSSProperties = isGrid
    ? { width: '100%', height: size, zIndex: item.z }
    : {
        width: size,
        height: size,
        zIndex: dragging ? 9999 : item.z,
        transform: `translate3d(${item.x}px, ${item.y}px, 0)`,
      };

  return (
    <div
      className={cn(
        isGrid ? 'relative will-change-transform' : 'group absolute left-0 top-0 touch-none will-change-transform',
        dragging ? 'z-50' : ''
      )}
      style={cardStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={!isGrid ? dragProps.onPointerMove : undefined}
      onPointerUp={!isGrid ? dragProps.onPointerUp : undefined}
      onPointerCancel={!isGrid ? dragProps.onPointerCancel : undefined}
    >
      {/* Note Paper container */}
      <div
        style={{
          transform: isGrid ? 'none' : dragging ? 'rotate(0deg)' : `rotate(${item.rotate}deg)`,
        }}
        className={cn(
          'relative h-full w-full rounded-xl flex flex-col bg-gradient-to-b text-stone-800 ring-1 ring-black/10',
          palette.paper,
          dragging
            ? 'shadow-2xl scale-[1.02] opacity-95 transition-none cursor-grabbing'
            : cn('shadow-md hover:shadow-lg transition-shadow duration-150', !isGrid ? 'cursor-grab' : ''),
          stateClass
        )}
      >
        {/* Top Handle bar for dragging & actions */}
        <div className="flex h-9 shrink-0 items-center justify-between px-3 pt-2 bg-black/[0.02]">
          {/* Grip dots handle */}
          <button
            type="button"
            aria-label="Move note"
            onKeyDown={onHandleKeyDown}
            className="-m-1 flex items-center gap-1 rounded p-1 cursor-grab active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-800/70"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-stone-900/30" />
            <span className="h-1.5 w-1.5 rounded-full bg-stone-900/30" />
            <span className="h-1.5 w-1.5 rounded-full bg-stone-900/30" />
          </button>

          {/* Color pickers + Delete button */}
          <div
            data-no-drag
            className="flex items-center gap-1.5 opacity-90 transition-opacity duration-150 group-hover:opacity-100"
          >
            {NOTE_COLOR_ORDER.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Change color to ${NOTE_COLORS[color].label}`}
                aria-pressed={color === item.color}
                title={NOTE_COLORS[color].label}
                onClick={(e) => {
                  e.stopPropagation();
                  onColor(item.id, color);
                }}
                className={cn(
                  'h-3.5 w-3.5 rounded-full ring-1 ring-black/20 transition-transform hover:scale-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-stone-800',
                  NOTE_COLORS[color].swatch,
                  color === item.color && 'ring-2 ring-stone-800',
                )}
              />
            ))}
            <button
              type="button"
              data-no-drag
              aria-label="Delete note"
              title="Delete"
              onClick={(e) => {
                e.stopPropagation();
                leave();
              }}
              className="ms-1 grid h-5 w-5 place-items-center rounded-full text-stone-700 hover:bg-black/10 hover:text-stone-900 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-800"
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

        {/* Note Body — data-no-drag enables instant typing everywhere in this area */}
        <div
          data-no-drag
          className="min-h-0 flex-1 px-3 pb-3 cursor-text flex flex-col"
        >
          {/* Note Title */}
          <input
            ref={titleRef}
            data-no-drag
            type="text"
            value={item.title ?? ''}
            maxLength={120}
            placeholder="Title..."
            dir="auto"
            aria-label="Note title"
            onChange={(event) => onTitle(item.id, event.target.value)}
            className="w-full bg-transparent font-semibold text-xs sm:text-sm text-stone-900 placeholder:text-stone-700/40 border-b border-stone-900/10 pb-1 mb-1 focus:outline-none focus:border-stone-900/30"
          />

          <textarea
            ref={textRef}
            data-no-drag
            value={item.text ?? ''}
            maxLength={1000}
            placeholder="Type your note here…"
            dir="auto"
            aria-label="Note text"
            onChange={(event) => onText(item.id, event.target.value)}
            onFocus={() => onRaise(item.id)}
            className="h-full w-full cursor-text select-text resize-none bg-transparent font-sans text-xs sm:text-sm leading-relaxed text-stone-800 placeholder:text-stone-800/40 focus:outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          />
        </div>

        {/* Subtle folded corner */}
        <span
          aria-hidden="true"
          style={{ width: 20, height: 20 }}
          className="pointer-events-none absolute bottom-0 right-0 bg-gradient-to-br from-black/20 to-black/5 [clip-path:polygon(0_0,100%_0,0_100%)] rounded-br-xl"
        />
      </div>

      {/* Tape on top */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-2 left-1/2 h-5 w-16 -translate-x-1/2 -rotate-1 bg-white/60 shadow-2xs backdrop-blur-[1px] rounded-xs"
      />
    </div>
  );
});
