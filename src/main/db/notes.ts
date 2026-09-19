/**
 * src/main/db/notes.ts
 * Lightweight, ultra-fast SQLite persistence for Sticky Notes and Stickers.
 */

import { getDb } from './index'

export interface DbNoteItem {
  id: string
  kind: 'note' | 'sticker'
  title?: string | null
  x: number
  y: number
  z: number
  rotate: number
  color?: string | null
  text?: string | null
  emoji?: string | null
  created_at?: string
  updated_at?: string
}

/** Retrieve all board items (notes & stickers) ordered by stacking z-index */
export function getAllNotes(): DbNoteItem[] {
  try {
    return getDb().prepare(`SELECT * FROM notes ORDER BY z ASC`).all() as DbNoteItem[]
  } catch (err) {
    console.error('[db/notes] Error reading notes:', err)
    return []
  }
}

/** Upsert all active board items in a single atomic SQLite transaction */
export function saveAllNotes(items: DbNoteItem[]): boolean {
  try {
    const db = getDb()
    const upsert = db.prepare(`
      INSERT INTO notes (id, kind, title, x, y, z, rotate, color, text, emoji, updated_at)
      VALUES (@id, @kind, @title, @x, @y, @z, @rotate, @color, @text, @emoji, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        kind = excluded.kind,
        title = excluded.title,
        x = excluded.x,
        y = excluded.y,
        z = excluded.z,
        rotate = excluded.rotate,
        color = excluded.color,
        text = excluded.text,
        emoji = excluded.emoji,
        updated_at = CURRENT_TIMESTAMP
    `)

    const tx = db.transaction(() => {
      if (items.length > 0) {
        // Delete items no longer on the board
        const placeholders = items.map(() => '?').join(',')
        db.prepare(`DELETE FROM notes WHERE id NOT IN (${placeholders})`).run(...items.map((i) => i.id))

        for (const item of items) {
          upsert.run({
            id: item.id,
            kind: item.kind,
            title: item.title || null,
            x: item.x,
            y: item.y,
            z: item.z,
            rotate: item.rotate,
            color: item.color || null,
            text: item.text || '',
            emoji: item.emoji || null
          })
        }
      } else {
        db.prepare('DELETE FROM notes').run()
      }
    })

    tx()
    return true
  } catch (err) {
    console.error('[db/notes] Error saving notes batch:', err)
    return false
  }
}

/** Delete a single note or sticker by id */
export function deleteNote(id: string): boolean {
  try {
    const res = getDb().prepare(`DELETE FROM notes WHERE id = ?`).run(id)
    return res.changes > 0
  } catch (err) {
    console.error('[db/notes] Error deleting note:', err)
    return false
  }
}

/** Clear all sticky notes and stickers */
export function clearAllNotes(): boolean {
  try {
    getDb().prepare(`DELETE FROM notes`).run()
    return true
  } catch (err) {
    console.error('[db/notes] Error clearing notes:', err)
    return false
  }
}
