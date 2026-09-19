import { memo, type RefObject } from 'react';
import { cn } from './cn';
import { STICKER_SIZE, type StickerItem } from './types';
import { useDrag } from './use-drag';
import { usePresence } from './use-presence';

interface StickerCardProps {
  item: StickerItem;
  boundsRef: RefObject<HTMLElement | null>;
  onMove: (id: string, x: number, y: number) => void;
  onRaise: (id: string) => void;
  onRemove: (id: string) => void;
}

export const StickerCard = memo(function StickerCard({
  item,
  boundsRef,
  onMove,
  onRaise,
  onRemove,
}: StickerCardProps) {
  const { stateClass, leave } = usePresence(() => onRemove(item.id), 180);
  const { dragging, dragProps, onHandleKeyDown } = useDrag({
    x: item.x,
    y: item.y,
    width: STICKER_SIZE,
    height: STICKER_SIZE,
    boundsRef,
    onMove: (x, y) => onMove(item.id, x, y),
  });

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    onRaise(item.id);
    dragProps.onPointerDown(e);
  };

  return (
    <div
      className={cn(
        'group absolute left-0 top-0 touch-none focus-within:outline-none will-change-transform',
        dragging ? 'cursor-grabbing z-50' : 'cursor-grab',
      )}
      style={{
        width: STICKER_SIZE,
        height: STICKER_SIZE,
        zIndex: dragging ? 9999 : item.z,
        transform: `translate3d(${item.x}px, ${item.y}px, 0)`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={dragProps.onPointerMove}
      onPointerUp={dragProps.onPointerUp}
      onPointerCancel={dragProps.onPointerCancel}
    >
      <div
        style={{ transform: dragging ? 'rotate(0deg)' : `rotate(${item.rotate}deg)` }}
        className={cn(
          'h-full w-full',
          dragging ? 'transition-none' : 'transition-transform duration-150 group-hover:-rotate-6'
        )}
      >
        <div
          className={cn(
            'h-full w-full',
            dragging ? 'scale-110 opacity-95 transition-none' : cn('transition-[transform,opacity] duration-200', stateClass)
          )}
        >
          <button
            type="button"
            aria-label={`Sticker ${item.emoji}. Move with the arrow keys.`}
            onKeyDown={onHandleKeyDown}
            className="flex h-full w-full [cursor:inherit] select-none items-center justify-center rounded-full text-[2.6rem] leading-none drop-shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            {item.emoji}
          </button>
        </div>
      </div>

      <button
        type="button"
        data-no-drag
        aria-label="Remove sticker"
        title="Remove"
        onClick={leave}
        className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-white text-stone-700 opacity-0 shadow transition-opacity duration-150 hover:text-stone-900 focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
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
  );
});
