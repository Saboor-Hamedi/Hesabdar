import { useEffect, useMemo, useReducer, useRef } from 'react';
import { NOTE_COLORS } from './colors';
import { clampPoint, type Size } from './geometry';
import {
  sizeOf,
  type BoardItem,
  type NoteColor,
  type NoteItem,
  type StickerItem,
  type SortOrder,
} from './types';

/* ------------------------------------------------------------------ */
/* Factories                                                           */
/* ------------------------------------------------------------------ */

const createId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

const randomTilt = (): number => Math.round((Math.random() * 7 - 3.5) * 10) / 10;

export function createNote(overrides: Partial<Omit<NoteItem, 'kind' | 'id'>> = {}): NoteItem {
  return {
    id: createId(),
    kind: 'note',
    title: '',
    x: 0,
    y: 0,
    z: 0,
    rotate: randomTilt(),
    color: 'butter',
    text: '',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createSticker(
  emoji: string,
  overrides: Partial<Omit<StickerItem, 'kind' | 'id' | 'emoji'>> = {},
): StickerItem {
  return {
    id: createId(),
    kind: 'sticker',
    emoji,
    x: 0,
    y: 0,
    z: 0,
    rotate: Math.round((Math.random() * 30 - 15) * 10) / 10,
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/* Reducer                                                             */
/* ------------------------------------------------------------------ */

interface BoardState {
  items: BoardItem[];
  topZ: number;
}

type Action =
  | { type: 'load'; items: BoardItem[] }
  | { type: 'add'; item: BoardItem }
  | { type: 'title'; id: string; title: string }
  | { type: 'text'; id: string; text: string }
  | { type: 'color'; id: string; color: NoteColor }
  | { type: 'move'; id: string; x: number; y: number }
  | { type: 'raise'; id: string }
  | { type: 'remove'; id: string }
  | { type: 'clear' }
  | { type: 'fit'; size: Size }
  | { type: 'arrange'; order: SortOrder; containerWidth: number; cardSize: number };

function patch(
  state: BoardState,
  id: string,
  update: (item: BoardItem) => BoardItem,
): BoardState {
  let changed = false;
  const items = state.items.map((item) => {
    if (item.id !== id) return item;
    const next = update(item);
    if (next !== item) changed = true;
    return next;
  });
  return changed ? { ...state, items } : state;
}

function reducer(state: BoardState, action: Action): BoardState {
  switch (action.type) {
    case 'load': {
      const topZ = action.items.reduce((max, item) => Math.max(max, item.z), 0);
      return { items: action.items, topZ };
    }
    case 'add': {
      const z = state.topZ + 1;
      return { items: [...state.items, { ...action.item, z }], topZ: z };
    }
    case 'title':
      return patch(state, action.id, (item) =>
        item.kind === 'note' && item.title !== action.title ? { ...item, title: action.title } : item,
      );
    case 'text':
      return patch(state, action.id, (item) =>
        item.kind === 'note' && item.text !== action.text ? { ...item, text: action.text } : item,
      );
    case 'color':
      return patch(state, action.id, (item) =>
        item.kind === 'note' && item.color !== action.color
          ? { ...item, color: action.color }
          : item,
      );
    case 'move':
      return patch(state, action.id, (item) =>
        item.x === action.x && item.y === action.y ? item : { ...item, x: action.x, y: action.y },
      );
    case 'raise': {
      const target = state.items.find((item) => item.id === action.id);
      if (!target || target.z === state.topZ) return state;
      const z = state.topZ + 1;
      return {
        items: state.items.map((item) => (item.id === action.id ? { ...item, z } : item)),
        topZ: z,
      };
    }
    case 'remove':
      return state.items.some((item) => item.id === action.id)
        ? { ...state, items: state.items.filter((item) => item.id !== action.id) }
        : state;
    case 'clear':
      return state.items.length ? { items: [], topZ: 0 } : state;
    case 'fit': {
      let changed = false;
      const items = state.items.map((item) => {
        const s = sizeOf(item);
        const p = clampPoint(action.size, item.x, item.y, s, s);
        if (p.x === item.x && p.y === item.y) return item;
        changed = true;
        return { ...item, x: p.x, y: p.y };
      });
      return changed ? { ...state, items } : state;
    }
    case 'arrange': {
      const sorted = [...state.items].sort((a, b) => {
        if (a.kind !== 'note' || b.kind !== 'note') return 0;
        if (action.order === 'newest') {
          return (b.created_at || b.id).localeCompare(a.created_at || a.id);
        }
        if (action.order === 'oldest') {
          return (a.created_at || a.id).localeCompare(b.created_at || b.id);
        }
        if (action.order === 'title_asc') {
          return (a.title || a.text || '').localeCompare(b.title || b.text || '');
        }
        if (action.order === 'title_desc') {
          return (b.title || b.text || '').localeCompare(a.title || a.text || '');
        }
        return 0;
      });
      const gap = 16;
      const step = action.cardSize + gap;
      const width = Math.max(300, action.containerWidth);
      const cols = Math.max(1, Math.floor((width - 32) / step));
      const arranged = sorted.map((item, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const x = 20 + col * step;
        const y = 20 + row * step;
        return { ...item, x, y, rotate: 0, z: idx + 1 };
      });
      return { items: arranged, topZ: arranged.length };
    }
  }
}

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function isBoardItem(value: unknown): value is BoardItem {
  if (typeof value !== 'object' || value === null) return false;
  const o = value as Record<string, unknown>;
  if (!(typeof o.id === 'string' && isNum(o.x) && isNum(o.y) && isNum(o.rotate) && isNum(o.z))) {
    return false;
  }
  if (o.kind === 'note') {
    return (
      typeof o.text === 'string' &&
      typeof o.color === 'string' &&
      o.color in NOTE_COLORS &&
      (o.title === undefined || typeof o.title === 'string' || o.title === null)
    );
  }
  return o.kind === 'sticker' && typeof o.emoji === 'string';
}

function loadItems(key: string): BoardItem[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isBoardItem) : null;
  } catch {
    return null;
  }
}

function saveItems(key: string, items: BoardItem[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    /* storage full or unavailable */
  }
}

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

export function useBoard(storageKey: string, initialItems: readonly BoardItem[] = []) {
  const [state, dispatch] = useReducer(reducer, undefined, (): BoardState => {
    const saved = loadItems(storageKey);
    let items: BoardItem[];
    if (saved && saved.length > 0) {
      items = saved;
    } else if (initialItems.length > 0) {
      items = [...initialItems];
    } else {
      items = [createNote({ x: 50, y: 40, color: 'butter', text: '' })];
    }
    return { items, topZ: items.reduce((max, item) => Math.max(max, item.z), 0) };
  });

  // Load latest state from SQLite database on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.api?.notes?.getAll) {
      window.api.notes
        .getAll()
        .then((dbItems: unknown) => {
          if (Array.isArray(dbItems) && dbItems.length > 0) {
            const valid = dbItems.filter(isBoardItem);
            if (valid.length > 0) {
              dispatch({ type: 'load', items: valid });
              saveItems(storageKey, valid);
            }
          }
        })
        .catch((err: any) => {
          console.error('[notes] Error loading from SQLite:', err);
        });
    }
  }, [storageKey]);

  // Save shortly after changes settle (to both localStorage and SQLite table 'notes')
  const latest = useRef(state.items);
  latest.current = state.items;

  useEffect(() => {
    const id = window.setTimeout(() => {
      saveItems(storageKey, state.items);
      if (typeof window !== 'undefined' && window.api?.notes?.saveAll) {
        window.api.notes.saveAll(state.items).catch(() => {});
      }
    }, 250);
    return () => window.clearTimeout(id);
  }, [storageKey, state.items]);

  useEffect(() => {
    const flush = () => {
      saveItems(storageKey, latest.current);
      if (typeof window !== 'undefined' && window.api?.notes?.saveAll) {
        window.api.notes.saveAll(latest.current).catch(() => {});
      }
    };
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('beforeunload', flush);
    };
  }, [storageKey]);

  const actions = useMemo(
    () => ({
      add: (item: BoardItem) => dispatch({ type: 'add', item }),
      setTitle: (id: string, title: string) => dispatch({ type: 'title', id, title }),
      setText: (id: string, text: string) => dispatch({ type: 'text', id, text }),
      setColor: (id: string, color: NoteColor) => dispatch({ type: 'color', id, color }),
      move: (id: string, x: number, y: number) => dispatch({ type: 'move', id, x, y }),
      raise: (id: string) => dispatch({ type: 'raise', id }),
      remove: (id: string) => dispatch({ type: 'remove', id }),
      clear: () => dispatch({ type: 'clear' }),
      fit: (size: Size) => dispatch({ type: 'fit', size }),
      arrange: (order: SortOrder, containerWidth: number, cardSize: number) =>
        dispatch({ type: 'arrange', order, containerWidth, cardSize }),
    }),
    [],
  );

  return { items: state.items, ...actions };
}
