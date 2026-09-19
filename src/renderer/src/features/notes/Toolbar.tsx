import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutGrid,
  Move,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  PanelRight,
  PanelRightClose,
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

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-gray-200/80 bg-white/95 px-3 py-2 shadow-xs dark:border-slate-800 dark:bg-slate-900/95 backdrop-blur-sm select-none">
      {/* Group 1: New Note Color Pickers */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          {t('notes.newNote', 'New')}
        </span>
        <div className="flex items-center gap-1.5">
          {NOTE_COLOR_ORDER.map((color) => (
            <button
              key={color}
              type="button"
              title={`${NOTE_COLORS[color].label} Note`}
              aria-label={`Add a ${NOTE_COLORS[color].label.toLowerCase()} note`}
              onClick={() => onAddNote(color)}
              className={cn(
                'h-6 w-6 rounded-md bg-gradient-to-b shadow-2xs ring-1 ring-black/15 transition-all duration-150 hover:-translate-y-0.5 hover:scale-110 active:scale-95 cursor-pointer',
                NOTE_COLORS[color].paper,
                focusRing,
              )}
            />
          ))}
        </div>
      </div>

      {/* Group 2: Layout Modes & Card Size Controls */}
      <div className="flex items-center gap-3">
        {/* Layout: Canvas vs Grid */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => onLayoutModeChange('canvas')}
            title={t('notes.canvasMode', 'Free Drag & Drop Canvas')}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
              layoutMode === 'canvas'
                ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            )}
          >
            <Move className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('notes.canvas', 'Canvas')}</span>
          </button>
          <button
            type="button"
            onClick={() => onLayoutModeChange('grid')}
            title={t('notes.gridMode', 'Auto Grid Layout')}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
              layoutMode === 'grid'
                ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('notes.grid', 'Grid')}</span>
          </button>
        </div>

        {/* Card Size: S / M / L */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 text-xs">
          {(['small', 'medium', 'large'] as CardSize[]).map((sz) => (
            <button
              key={sz}
              type="button"
              onClick={() => onCardSizeChange(sz)}
              title={`${sz.charAt(0).toUpperCase() + sz.slice(1)} Size`}
              className={cn(
                'px-2 py-0.5 rounded-md font-semibold uppercase text-[11px] transition-colors cursor-pointer',
                cardSize === sz
                  ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              {sz.charAt(0)}
            </button>
          ))}
        </div>

        {/* Sort Order: Toggle Newest / Oldest / Title */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => {
              if (sortOrder === 'newest') onSortChange('oldest');
              else if (sortOrder === 'oldest') onSortChange('title_asc');
              else if (sortOrder === 'title_asc') onSortChange('title_desc');
              else onSortChange('newest');
            }}
            title={`Sort Order: ${sortOrder.replace('_', ' ')}`}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {sortOrder === 'newest' && (
              <>
                <ArrowDownNarrowWide className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-[11px]">{t('notes.newest', 'Newest')}</span>
              </>
            )}
            {sortOrder === 'oldest' && (
              <>
                <ArrowUpNarrowWide className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-[11px]">{t('notes.oldest', 'Oldest')}</span>
              </>
            )}
            {sortOrder === 'title_asc' && (
              <>
                <ArrowDownNarrowWide className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-[11px]">A → Z</span>
              </>
            )}
            {sortOrder === 'title_desc' && (
              <>
                <ArrowUpNarrowWide className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-[11px]">Z → A</span>
              </>
            )}
          </button>
        </div>

        {/* Stick to Side Mode Toggle */}
        {onToggleSideDock && (
          <button
            type="button"
            onClick={onToggleSideDock}
            title={isSideDocked ? t('notes.dockBottom', 'Dock to Bottom') : t('notes.stickSide', 'Stick to Side')}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer shadow-2xs',
              isSideDocked
                ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700'
            )}
          >
            {isSideDocked ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRight className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">
              {isSideDocked ? t('notes.sideDocked', 'Side Stuck') : t('notes.stickSide', 'Stick to Side')}
            </span>
          </button>
        )}
      </div>

      {/* Group 3: Note Count & Clear Board */}
      <div className="flex items-center gap-2">
        <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400 px-1">
          {count} {count === 1 ? t('notes.item', 'item') : t('notes.items', 'items')}
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
            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer',
            confirming
              ? 'bg-rose-600 text-white hover:bg-rose-700'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
            focusRing,
          )}
        >
          {confirming ? t('notes.confirmClear', 'Click to confirm') : t('notes.clearBoard', 'Clear')}
        </button>
      </div>
    </div>
  );
});
