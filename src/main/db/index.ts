/**
 * src/main/db/index.ts
 *
 * Single DB connection. Runs all SQL migrations on startup.
 * better-sqlite3 is synchronous — no promises needed.
 */

import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { INITIAL_SCHEMA } from './schema'
import { DEFAULT_CATALOG_ITEMS } from './defaultCatalog'

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (_db) return _db

  const dbPath = join(app.getPath('userData'), 'hesabdar.db')
  _db = new Database(dbPath)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  _db.pragma('synchronous = NORMAL')
  return _db
}

/** Seed standard commodity catalog into SQLite catalog_items table if empty */
function seedCatalogIfEmpty(db: Database.Database): void {
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM catalog_items').get() as { cnt: number }
  if (existing && existing.cnt > 0) return

  const insert = db.prepare(`
    INSERT OR IGNORE INTO catalog_items
      (id, barcode, name_en, name_fa, name_ps, unit, category, suggested_cost, suggested_price, default_stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const tx = db.transaction(() => {
    for (const item of DEFAULT_CATALOG_ITEMS) {
      insert.run(
        item.id,
        item.barcode,
        item.name_en,
        item.name_fa,
        item.name_ps,
        item.unit,
        item.category,
        item.suggested_cost,
        item.suggested_price,
        item.default_stock
      )
    }
  })
  tx()
}

/** Seed starter 25 commodities into SQLite products table on fresh install if empty */
function seedInitialProductsIfEmpty(db: Database.Database): void {
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM products').get() as { cnt: number }
  if (existing && existing.cnt > 0) return

  const insertProduct = db.prepare(`
    INSERT INTO products
      (barcode, name_fa, name_ps, name_en, unit, cost_price, sell_price, stock_qty, reorder_level, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `)

  const tx = db.transaction(() => {
    for (const item of DEFAULT_CATALOG_ITEMS.slice(0, 25)) {
      insertProduct.run(
        item.barcode,
        item.name_fa,
        item.name_ps,
        item.name_en,
        item.unit,
        item.suggested_cost,
        item.suggested_price,
        item.default_stock,
        10
      )
    }
  })
  tx()
}

/** Run all database schemas, indexes, and initial SQLite data. Safe to call on every launch. */
export function runMigrations(): void {
  const db = getDb()
  try {
    db.exec(INITIAL_SCHEMA)
    try {
      db.exec('ALTER TABLE notes ADD COLUMN title TEXT;')
    } catch {}
    seedCatalogIfEmpty(db)
    seedInitialProductsIfEmpty(db)
  } catch (err) {
    console.error('[db] Error running initial schema:', err)
  }
}

