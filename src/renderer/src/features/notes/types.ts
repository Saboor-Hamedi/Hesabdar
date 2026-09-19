export type NoteColor = 'butter' | 'blush' | 'mint' | 'sky' | 'lilac' | 'peach';

export type BoardLayoutMode = 'canvas' | 'grid';
export type CardSize = 'small' | 'medium' | 'large';
export type SortOrder = 'newest' | 'oldest' | 'title_asc' | 'title_desc';

export const CARD_SIZES: Record<CardSize, { size: number; label: string }> = {
  small: { size: 180, label: 'S' },
  medium: { size: 220, label: 'M' },
  large: { size: 280, label: 'L' },
};

export const NOTE_SIZE = 220;
export const STICKER_SIZE = 64;

interface BaseItem {
  id: string;
  /** Position inside the board, in px */
  x: number;
  y: number;
  /** Resting tilt in degrees */
  rotate: number;
  /** Stacking order; the last item touched has the highest z */
  z: number;
  created_at?: string;
  updated_at?: string;
}

export interface NoteItem extends BaseItem {
  kind: 'note';
  title?: string;
  color: NoteColor;
  text: string;
}

export interface StickerItem extends BaseItem {
  kind: 'sticker';
  emoji: string;
}

export type BoardItem = NoteItem | StickerItem;

export const sizeOf = (item: BoardItem, cardSize: CardSize = 'medium'): number =>
  item.kind === 'note' ? CARD_SIZES[cardSize].size : STICKER_SIZE;
