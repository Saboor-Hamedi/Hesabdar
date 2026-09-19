import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StickyNote } from 'lucide-react';
import { createNote, useBoard } from './board-state';
import { cn } from './cn';
import { NoteCard } from './NoteCard';
import { Toolbar } from './Toolbar';
import {
  CARD_SIZES,
  type BoardItem,
  type BoardLayoutMode,
  type CardSize,
  type NoteColor,
  type SortOrder,
} from './types';

export interface StickyBoardProps {
  /** localStorage key. Use a different key for each board. */
  storageKey?: string;
  /** Shown the first time, before anything has been saved. */
  initialItems?: readonly BoardItem[];
  className?: string;
  isSideDocked?: boolean;
  onToggleSideDock?: () => void;
}

/** Staggered spawn position — notes are placed in a neat cascade, never stacked. */
function spawnPoint(size: number, existingCount: number) {
  const gap = 24;
  const step = size + gap;
  const col = existingCount % 4;
  const row = Math.floor(existingCount / 4);
  const x = 32 + col * step;
  const y = 32 + row * step;
  return { x, y };
}

export function StickyBoard({
  storageKey = 'sticky-board:v1',
  initialItems,
  className,
  isSideDocked,
  onToggleSideDock,
}: StickyBoardProps) {
  const { t } = useTranslation();
  const boardRef = useRef<HTMLDivElement>(null);
  const board = useBoard(storageKey, initialItems);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<BoardLayoutMode>('canvas');
  const [cardSize, setCardSize] = useState<CardSize>('medium');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const { add, fit, arrange } = board;
  const cardPixelSize = CARD_SIZES[cardSize].size;

  // Keep everything on the board when it gets smaller.
  useEffect(() => {
    const el = boardRef.current;
    if (!el || layoutMode !== 'canvas') return;
    const observer = new ResizeObserver(() =>
      fit({ width: el.clientWidth, height: el.clientHeight }),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fit, layoutMode]);

  const addNote = useCallback(
    (color: NoteColor, pos?: { x: number; y: number }) => {
      const position = pos ?? spawnPoint(cardPixelSize, board.items.length);
      const note = createNote({ color, ...position });
      add(note);
      setLastAddedId(note.id);
    },
    [add, cardPixelSize, board.items.length],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (layoutMode === 'canvas' && e.target === boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        const x = Math.max(16, Math.min(rect.width - cardPixelSize - 16, e.clientX - rect.left - cardPixelSize / 2));
        const y = Math.max(16, Math.min(rect.height - cardPixelSize - 16, e.clientY - rect.top - cardPixelSize / 2));
        addNote('butter', { x, y });
      }
    },
    [addNote, cardPixelSize, layoutMode],
  );

  // Handle sort order changes
  const handleSortChange = useCallback(
    (order: SortOrder) => {
      setSortOrder(order);
      if (layoutMode === 'canvas') {
        const width = boardRef.current?.clientWidth ?? 800;
        arrange(order, width, cardPixelSize);
      }
    },
    [arrange, cardPixelSize, layoutMode],
  );

  const sortedItems = useMemo(() => {
    if (layoutMode !== 'grid') return board.items;
    const list = [...board.items];
    list.sort((a, b) => {
      if (a.kind !== 'note' || b.kind !== 'note') return 0;
      if (sortOrder === 'newest') return (b.created_at || b.id).localeCompare(a.created_at || a.id);
      if (sortOrder === 'oldest') return (a.created_at || a.id).localeCompare(b.created_at || b.id);
      if (sortOrder === 'title_asc') return (a.title || a.text || '').localeCompare(b.title || b.text || '');
      if (sortOrder === 'title_desc') return (b.title || b.text || '').localeCompare(a.title || a.text || '');
      return 0;
    });
    return list;
  }, [board.items, layoutMode, sortOrder]);

  return (
    <section className={cn('flex flex-col gap-2.5 h-full min-h-0 overflow-hidden', className)}>
      <Toolbar
        count={board.items.length}
        layoutMode={layoutMode}
        cardSize={cardSize}
        sortOrder={sortOrder}
        isSideDocked={isSideDocked}
        onAddNote={(color) => addNote(color)}
        onLayoutModeChange={setLayoutMode}
        onCardSizeChange={setCardSize}
        onSortChange={handleSortChange}
        onToggleSideDock={onToggleSideDock}
        onClear={board.clear}
      />

      <div
        ref={boardRef}
        role="region"
        aria-label="Sticky note board"
        onDoubleClick={handleDoubleClick}
        className={cn(
          // Theme-aware background: light board in light mode, dark board in dark mode
          'relative min-h-0 h-full flex-1 rounded-2xl',
          'bg-slate-100 dark:bg-[#1E293B]',
          'bg-[radial-gradient(rgba(0,0,0,0.08)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.10)_1px,transparent_1px)]',
          'bg-[length:24px_24px]',
          'shadow-[inset_0_2px_10px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_2px_14px_rgba(0,0,0,0.4)]',
          'ring-1 ring-black/8 dark:ring-black/30',
          'border border-slate-200/80 dark:border-slate-700/60',
          // Invisible scrollbars — functional but hidden (no knob/corner either)
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar-corner]:hidden',
          layoutMode === 'grid' ? 'overflow-y-auto p-4' : 'overflow-auto'
        )}
      >
        {board.items.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center select-none">
            <button
              type="button"
              onClick={() => addNote('butter')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-200 border border-amber-500/40 transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer font-medium text-sm"
            >
              <StickyNote className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span>{t('notes.addFirstNote', 'Click here to add your first note')}</span>
            </button>
            <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400">
              {t('notes.doubleClickHint', 'Or double-click anywhere on the board to write')}
            </p>
          </div>
        )}

        {layoutMode === 'grid' ? (
          <div
            className="grid gap-4 w-full"
            style={{
              gridTemplateColumns: `repeat(auto-fill, minmax(${cardPixelSize}px, 1fr))`,
            }}
          >
            {sortedItems.map((item) =>
              item.kind === 'note' ? (
                <NoteCard
                  key={item.id}
                  item={item}
                  boundsRef={boardRef}
                  autoFocus={item.id === lastAddedId}
                  size={cardPixelSize}
                  isGrid={true}
                  onTitle={board.setTitle}
                  onText={board.setText}
                  onColor={board.setColor}
                  onMove={board.move}
                  onRaise={board.raise}
                  onRemove={board.remove}
                />
              ) : null
            )}
          </div>
        ) : (
          <>
            {/* Dynamic spacer — sized to the furthest note so we only scroll as far as needed */}
            <div
              className="pointer-events-none absolute top-0 left-0"
              aria-hidden="true"
              style={{
                width: Math.max(
                  800,
                  ...board.items
                    .filter((i) => i.kind === 'note')
                    .map((i) => i.x + cardPixelSize + 48)
                ),
                height: Math.max(
                  500,
                  ...board.items
                    .filter((i) => i.kind === 'note')
                    .map((i) => i.y + cardPixelSize + 48)
                ),
              }}
            />
            {board.items.map((item) =>
              item.kind === 'note' ? (
                <NoteCard
                  key={item.id}
                  item={item}
                  boundsRef={boardRef}
                  autoFocus={item.id === lastAddedId}
                  size={cardPixelSize}
                  isGrid={false}
                  onTitle={board.setTitle}
                  onText={board.setText}
                  onColor={board.setColor}
                  onMove={board.move}
                  onRaise={board.raise}
                  onRemove={board.remove}
                />
              ) : null
            )}
          </>
        )}
      </div>
    </section>
  );
}
