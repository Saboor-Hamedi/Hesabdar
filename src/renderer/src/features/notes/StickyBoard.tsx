import { useCallback, useEffect, useRef, useState } from 'react';
import { createNote, createSticker, useBoard } from './board-state';
import { cn } from './cn';
import { clampPoint } from './geometry';
import { NoteCard } from './NoteCard';
import { StickerCard } from './StickerCard';
import { Toolbar } from './Toolbar';
import { NOTE_SIZE, STICKER_SIZE, type BoardItem, type NoteColor } from './types';

export interface StickyBoardProps {
  /** localStorage key. Use a different key for each board. */
  storageKey?: string;
  /** Shown the first time, before anything has been saved. */
  initialItems?: readonly BoardItem[];
  className?: string;
}

/** A spot near the middle of the board, nudged so new items don't stack exactly. */
function spawnPoint(board: HTMLElement | null, size: number) {
  const width = board?.clientWidth ?? 800;
  const height = board?.clientHeight ?? 500;
  const jitter = () => (Math.random() - 0.5) * 160;
  return clampPoint(
    { width, height },
    (width - size) / 2 + jitter(),
    (height - size) / 2 + jitter(),
    size,
    size,
  );
}

export function StickyBoard({
  storageKey = 'sticky-board:v1',
  initialItems,
  className,
}: StickyBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const board = useBoard(storageKey, initialItems);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const { add, fit } = board;

  // Keep everything on the board when it gets smaller.
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() =>
      fit({ width: el.clientWidth, height: el.clientHeight }),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fit]);

  const addNote = useCallback(
    (color: NoteColor) => {
      const note = createNote({ color, ...spawnPoint(boardRef.current, NOTE_SIZE) });
      add(note);
      setLastAddedId(note.id);
    },
    [add],
  );

  const addSticker = useCallback(
    (emoji: string) => {
      add(createSticker(emoji, spawnPoint(boardRef.current, STICKER_SIZE)));
    },
    [add],
  );

  return (
    <section className={cn('flex flex-col gap-3', className)}>
      <Toolbar
        count={board.items.length}
        onAddNote={addNote}
        onAddSticker={addSticker}
        onClear={board.clear}
      />

      <div
        ref={boardRef}
        role="region"
        aria-label="Sticky note board"
        className="relative min-h-[26rem] flex-1 overflow-hidden rounded-2xl bg-[#2C3948] bg-[radial-gradient(rgba(255,255,255,0.1)_1.2px,transparent_1.2px)] bg-[length:24px_24px] shadow-[inset_0_2px_14px_rgba(0,0,0,0.4)] ring-1 ring-black/30"
      >
        {board.items.length === 0 && (
          <p className="pointer-events-none absolute inset-0 grid place-items-center px-6 text-center text-sm text-white/55">
            Nothing here yet. Pick a color above to add your first note.
          </p>
        )}

        {board.items.map((item) =>
          item.kind === 'note' ? (
            <NoteCard
              key={item.id}
              item={item}
              boundsRef={boardRef}
              autoFocus={item.id === lastAddedId}
              onText={board.setText}
              onColor={board.setColor}
              onMove={board.move}
              onRaise={board.raise}
              onRemove={board.remove}
            />
          ) : (
            <StickerCard
              key={item.id}
              item={item}
              boundsRef={boardRef}
              onMove={board.move}
              onRaise={board.raise}
              onRemove={board.remove}
            />
          ),
        )}
      </div>
    </section>
  );
}
