import type { NoteColor } from './types';

interface NotePalette {
  label: string;
  /** Paper gradient (top → bottom) */
  paper: string;
  /** Solid colour for swatches and buttons */
  swatch: string;
}

/**
 * Full class names are written out on purpose so Tailwind's scanner can see them.
 */
export const NOTE_COLORS: Record<NoteColor, NotePalette> = {
  butter: { label: 'Butter', paper: 'from-[#FFF08A] to-[#FFDF4F]', swatch: 'bg-[#FFDF4F]' },
  blush: { label: 'Blush', paper: 'from-[#FFD3DE] to-[#FFA9C0]', swatch: 'bg-[#FFA9C0]' },
  mint: { label: 'Mint', paper: 'from-[#CFF7E0] to-[#92E5B8]', swatch: 'bg-[#92E5B8]' },
  sky: { label: 'Sky', paper: 'from-[#CDE9FF] to-[#8FCCFF]', swatch: 'bg-[#8FCCFF]' },
  lilac: { label: 'Lilac', paper: 'from-[#E6D8FF] to-[#C0A6FF]', swatch: 'bg-[#C0A6FF]' },
  peach: { label: 'Peach', paper: 'from-[#FFE0C4] to-[#FFB87D]', swatch: 'bg-[#FFB87D]' },
};

export const NOTE_COLOR_ORDER = Object.keys(NOTE_COLORS) as NoteColor[];

export const STICKERS = [
  { emoji: '⭐', name: 'star' },
  { emoji: '🔥', name: 'fire' },
  { emoji: '💡', name: 'idea' },
  { emoji: '✅', name: 'check' },
  { emoji: '❤️', name: 'heart' },
  { emoji: '📌', name: 'pin' },
  { emoji: '🎯', name: 'target' },
  { emoji: '🌈', name: 'rainbow' },
] as const;
