/**
 * src/main/db/products.ts
 *
 * All product CRUD operations against SQLite.
 * FTS5 triggers keep products_fts in sync automatically.
 */

import { getDb } from './index'
import type { UnitType } from '../../renderer/src/core/types'

export interface DbProduct {
  id: number
  barcode: string | null
  name_fa: string
  name_ps: string | null
  name_en: string | null
  category_id: number | null
  category_name: string | null
  unit: UnitType
  cost_price: number
  sell_price: number
  stock_qty: number
  reorder_level: number
  is_active: number
  created_at: string
}

export function getAllProducts(): DbProduct[] {
  const db = getDb()
  return db.prepare(`
    SELECT p.*, c.name_en as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1
    ORDER BY p.id DESC
  `).all() as DbProduct[]
}

export function searchProducts(query: string): DbProduct[] {
  const db = getDb()
  if (!query.trim()) return getAllProducts()
  // FTS5 search — fast, trilingual, diacritics-normalised
  try {
    const results = db.prepare(`
      SELECT p.*, c.name_en as category_name
      FROM products_fts fts
      JOIN products p ON fts.rowid = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE products_fts MATCH ? AND p.is_active = 1
      ORDER BY rank
      LIMIT 100
    `).all(`${query.trim()}*`) as DbProduct[]
    if (results.length > 0) return results
  } catch {}
  // Fallback: LIKE search when FTS query is malformed
  const q = `%${query.trim()}%`
  return db.prepare(`
    SELECT p.*, c.name_en as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1
      AND (p.name_fa LIKE ? OR p.name_ps LIKE ? OR p.name_en LIKE ? OR p.barcode LIKE ?)
    ORDER BY p.id DESC LIMIT 100
  `).all(q, q, q, q) as DbProduct[]
}

export function getProductByBarcode(barcode: string): DbProduct | undefined {
  const db = getDb()
  return db.prepare(`
    SELECT p.*, c.name_en as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.barcode = ? AND p.is_active = 1
  `).get(barcode) as DbProduct | undefined
}

export function createProduct(input: {
  barcode?: string | null
  name_fa: string
  name_ps?: string | null
  name_en?: string | null
  category_name?: string | null
  unit: UnitType
  cost_price: number
  sell_price: number
  stock_qty: number
  reorder_level?: number
}): DbProduct {
  const db = getDb()

  // Upsert category
  let categoryId: number | null = null
  if (input.category_name?.trim()) {
    const cat = input.category_name.trim()
    db.prepare(`INSERT OR IGNORE INTO categories (name_fa, name_en) VALUES (?, ?)`).run(cat, cat)
    const row = db.prepare(`SELECT id FROM categories WHERE name_en = ? OR name_fa = ? LIMIT 1`).get(cat, cat) as { id: number } | undefined
    categoryId = row?.id ?? null
  }

  const result = db.prepare(`
    INSERT INTO products (barcode, name_fa, name_ps, name_en, category_id, unit, cost_price, sell_price, stock_qty, reorder_level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.barcode?.trim() || null,
    input.name_fa.trim(),
    input.name_ps?.trim() || null,
    input.name_en?.trim() || null,
    categoryId,
    input.unit,
    Number(input.cost_price) || 0,
    Number(input.sell_price) || 0,
    Number(input.stock_qty) || 0,
    Number(input.reorder_level) || 5,
  )

  return db.prepare(`
    SELECT p.*, c.name_en as category_name
    FROM products p LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).get(result.lastInsertRowid) as DbProduct
}

export function updateProduct(id: number, updates: Partial<Omit<DbProduct, 'id' | 'created_at'>>): DbProduct | null {
  const db = getDb()

  // Handle category upsert if name changed
  let categoryId: number | undefined
  if ('category_name' in updates && updates.category_name) {
    const cat = updates.category_name.trim()
    db.prepare(`INSERT OR IGNORE INTO categories (name_fa, name_en) VALUES (?, ?)`).run(cat, cat)
    const row = db.prepare(`SELECT id FROM categories WHERE name_en = ? OR name_fa = ? LIMIT 1`).get(cat, cat) as { id: number } | undefined
    categoryId = row?.id
  }

  const fields: string[] = []
  const values: unknown[] = []

  const colMap: Record<string, string> = {
    barcode: 'barcode', name_fa: 'name_fa', name_ps: 'name_ps', name_en: 'name_en',
    unit: 'unit', cost_price: 'cost_price', sell_price: 'sell_price',
    stock_qty: 'stock_qty', reorder_level: 'reorder_level', is_active: 'is_active',
  }

  for (const [key, col] of Object.entries(colMap)) {
    if (key in updates) {
      fields.push(`${col} = ?`)
      values.push((updates as Record<string, unknown>)[key])
    }
  }
  if (categoryId !== undefined) {
    fields.push('category_id = ?')
    values.push(categoryId)
  }
  if (!fields.length) return null

  values.push(id)
  db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).run(...values)

  return db.prepare(`
    SELECT p.*, c.name_en as category_name
    FROM products p LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).get(id) as DbProduct
}

export function deleteProduct(id: number): boolean {
  const db = getDb()
  const result = db.prepare(`UPDATE products SET is_active = 0 WHERE id = ?`).run(id)
  return result.changes > 0
}

export function adjustProductStock(id: number, delta: number): DbProduct | null {
  const db = getDb()
  db.prepare(`
    UPDATE products SET stock_qty = MAX(0, stock_qty + ?) WHERE id = ?
  `).run(delta, id)
  return db.prepare(`
    SELECT p.*, c.name_en as category_name
    FROM products p LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).get(id) as DbProduct | null
}
