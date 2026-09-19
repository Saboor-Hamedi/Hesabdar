import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutGrid,
  Move,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  PanelRight,
  PanelRightClose,
  Trash2,
} from 'lucide-react';
import { NOTE_COLORS, NOTE_COLOR_ORDER } from './colors';
import { cn } from './cn';
import type { NoteColor, BoardLayoutMode, CardSize, SortOrder } from './types';

interface ToolbarProps {
  count: number;
  layoutMode: BoardLayoutMode;
  cardSize: CardSize;
  sortOrder: SortOrder;
  isSideDocked?: boolean;
  onAddNote: (color: NoteColor) => void;
  onLayoutModeChange: (mode: BoardLayoutMode) => void;
  onCardSizeChange: (size: CardSize) => void;
  onSortChange: (order: SortOrder) => void;
  onToggleSideDock?: () => void;
  onClear: () => void;
}

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900';

const segBtn = (active: boolean) =>
  cn(
    'flex items-center justify-center px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
    active
      ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-2xs'
      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200',
  );

export const Toolbar = memo(function Toolbar({
  count,
  layoutMode,
  cardSize,
  sortOrder,
  isSideDocked,
  onAddNote,
  onLayoutModeChange,
  onCardSizeChange,
  onSortChange,
  onToggleSideDock,
  onClear,
}: ToolbarProps) {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const id = window.setTimeout(() => setConfirming(false), 3000);
    return () => window.clearTimeout(id);
  }, [confirming]);

  useEffect(() => {
    if (count === 0) setConfirming(false);
  }, [count]);

  const nextSort = () => {
    if (sortOrder === 'newest') onSortChange('oldest');
    else if (sortOrder === 'oldest') onSortChange('title_asc');
    else if (sortOrder === 'title_asc') onSortChange('title_desc');
    else onSortChange('newest');
  };

  const SortIcon =
    sortOrder === 'oldest' || sortOrder === 'title_desc'
      ? ArrowUpNarrowWide
      : ArrowDownNarrowWide;

  const sortLabel =
    sortOrder === 'newest'
      ? t('notes.newest', 'New')
      : sortOrder === 'oldest'
        ? t('notes.oldest', 'Old')
        : sortOrder === 'title_asc'
          ? 'A–Z'
          : 'Z–A';

  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95 backdrop-blur-sm select-none px-2 py-1.5 shadow-xs overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

      {/* ── Color pickers ───────────────────────────────── */}
      <div className="flex items-center gap-1 shrink-0">
        {NOTE_COLOR_ORDER.map((color) => (
          <button
            key={color}
            type="button"
            title={`${NOTE_COLORS[color].label} note`}
            aria-label={`Add ${NOTE_COLORS[color].label.toLowerCase()} note`}
            onClick={() => onAddNote(color)}
            className={cn(
              'h-5 w-5 rounded-[4px] bg-gradient-to-b shadow-2xs ring-1 ring-black/15 transition-all duration-150 hover:-translate-y-0.5 hover:scale-110 active:scale-95 cursor-pointer shrink-0',
              NOTE_COLORS[color].paper,
              focusRing,
            )}
          />
        ))}
      </div>

      <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 shrink-0" />

      {/* ── Canvas / Grid ────────────────────────────────── */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 shrink-0">
        <button
          type="button"
          onClick={() => onLayoutModeChange('canvas')}
          title={t('notes.canvasMode', 'Free drag canvas')}
          className={segBtn(layoutMode === 'canvas')}
        >
          <Move className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onLayoutModeChange('grid')}
          title={t('notes.gridMode', 'Auto grid layout')}
          className={segBtn(layoutMode === 'grid')}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── S / M / L ────────────────────────────────────── */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 shrink-0">
        {(['small', 'medium', 'large'] as CardSize[]).map((sz) => (
          <button
            key={sz}
            type="button"
            onClick={() => onCardSizeChange(sz)}
            title={`${sz.charAt(0).toUpperCase() + sz.slice(1)} cards`}
            className={cn(
              'w-6 py-0.5 rounded-md font-bold uppercase text-[11px] transition-colors cursor-pointer',
              cardSize === sz
                ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200',
            )}
          >
            {sz.charAt(0)}
          </button>
        ))}
      </div>

      {/* ── Sort ─────────────────────────────────────────── */}
      <button
        type="button"
        onClick={nextSort}
        title={`Sort: ${sortOrder.replace('_', ' ')}`}
        className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60 bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer text-[11px] font-medium shrink-0"
      >
        <SortIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
        <span className="hidden sm:inline">{sortLabel}</span>
      </button>

      {/* ── Spacer ───────────────────────────────────────── */}
      <div className="flex-1 min-w-0" />

      {/* ── Count ────────────────────────────────────────── */}
      <span className="text-[11px] tabular-nums text-slate-400 dark:text-slate-500 shrink-0 hidden sm:inline">
        {count}
      </span>

      {/* ── Dock to side ─────────────────────────────────── */}
      {onToggleSideDock && (
        <button
          type="button"
          onClick={onToggleSideDock}
          title={isSideDocked ? t('notes.dockBottom', 'Dock to bottom') : t('notes.stickSide', 'Stick to side')}
          className={cn(
            'flex items-center justify-center h-6 w-6 rounded-lg border transition-all cursor-pointer shrink-0',
            isSideDocked
              ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700',
          )}
        >
          {isSideDocked
            ? <PanelRightClose className="w-3.5 h-3.5" />
            : <PanelRight className="w-3.5 h-3.5" />}
        </button>
      )}

      {/* ── Clear ────────────────────────────────────────── */}
      <button
        type="button"
        disabled={count === 0}
        onClick={() => {
          if (confirming) { setConfirming(false); onClear(); }
          else setConfirming(true);
        }}
        title={confirming ? 'Click again to confirm clearing all notes' : 'Clear all notes'}
        className={cn(
          'flex items-center gap-1 h-6 rounded-md px-2 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-35 cursor-pointer shrink-0',
          confirming
            ? 'bg-rose-600 text-white hover:bg-rose-700'
            : 'text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400',
          focusRing,
        )}
      >
        <Trash2 className="w-3.5 h-3.5 shrink-0" />
        {confirming && <span>{t('notes.confirmClear', 'Sure?')}</span>}
      </button>
    </div>
  );
});
