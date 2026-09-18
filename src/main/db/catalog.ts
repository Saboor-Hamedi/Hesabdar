/**
 * src/main/db/catalog.ts
 * Catalog items — seeded once from the built-in array, read from SQLite after.
 */

import { getDb } from './index'

export interface DbCatalogItem {
  id: string
  barcode: string
  name_en: string
  name_fa: string
  name_ps: string
  unit: string
  category: string
  suggested_cost: number
  suggested_price: number
  default_stock: number
}

export function getAllCatalogItems(): DbCatalogItem[] {
  return getDb().prepare(`SELECT * FROM catalog_items ORDER BY category, name_en`).all() as DbCatalogItem[]
}

export function searchCatalogItems(query: string): DbCatalogItem[] {
  if (!query.trim()) return getAllCatalogItems()
  const q = `%${query.trim()}%`
  return getDb().prepare(`
    SELECT * FROM catalog_items
    WHERE name_en LIKE ? OR name_fa LIKE ? OR name_ps LIKE ? OR barcode LIKE ? OR category LIKE ?
    ORDER BY category, name_en
  `).all(q, q, q, q, q) as DbCatalogItem[]
}

export function seedCatalogItems(items: DbCatalogItem[]): { seeded: number } {
  const db = getDb()
  const existing = db.prepare(`SELECT COUNT(*) as cnt FROM catalog_items`).get() as { cnt: number }
  if (existing.cnt > 0) return { seeded: 0 }

  const insert = db.prepare(`
    INSERT OR IGNORE INTO catalog_items
      (id, barcode, name_en, name_fa, name_ps, unit, category, suggested_cost, suggested_price, default_stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const seedAll = db.transaction(() => {
    for (const item of items) {
      insert.run(
        item.id, item.barcode, item.name_en, item.name_fa, item.name_ps,
        item.unit, item.category, item.suggested_cost, item.suggested_price, item.default_stock
      )
    }
  })
  seedAll()
  return { seeded: items.length }
}
