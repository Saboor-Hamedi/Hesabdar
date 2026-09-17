import { getDb } from '../db/connection'
import { buildFtsQuery, normalizePersian } from '../db/persian'

export interface Product {
  id: number
  barcode: string | null
  name_fa: string
  name_ps: string | null
  name_en: string | null
  category_id: number | null
  unit: string
  cost_price: number
  sell_price: number
  stock_qty: number
  reorder_level: number
  is_active: number
  created_at: string
}

export interface ProductInput {
  barcode?: string | null
  name_fa: string
  name_ps?: string | null
  name_en?: string | null
  category_id?: number | null
  unit: string
  cost_price: number
  sell_price: number
  stock_qty?: number
  reorder_level?: number
}

export function searchProducts(query: string, limit = 50): Product[] {
  const db = getDb()
  const fts = buildFtsQuery(query)

  if (!fts) {
    return db.prepare(
      `SELECT * FROM products WHERE is_active = 1 ORDER BY id DESC LIMIT ?`
    ).all(limit) as Product[]
  }

  return db.prepare(`
    SELECT p.* FROM products_fts f
    JOIN products p ON p.id = f.rowid
    WHERE products_fts MATCH ?
      AND p.is_active = 1
    ORDER BY bm25(products_fts, 10.0, 8.0, 5.0, 20.0)
    LIMIT ?
  `).all(fts, limit) as Product[]
}

export function getProductByBarcode(barcode: string): Product | null {
  const db = getDb()
  return (db.prepare(
    `SELECT * FROM products WHERE barcode = ? AND is_active = 1`
  ).get(barcode) as Product) ?? null
}

export function createProduct(input: ProductInput): Product {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO products
      (barcode, name_fa, name_ps, name_en, category_id, unit,
       cost_price, sell_price, stock_qty, reorder_level)
    VALUES
      (@barcode, @name_fa, @name_ps, @name_en, @category_id, @unit,
       @cost_price, @sell_price, @stock_qty, @reorder_level)
  `)
  const info = stmt.run({
    barcode: input.barcode ?? null,
    name_fa: normalizePersian(input.name_fa),
    name_ps: input.name_ps ? normalizePersian(input.name_ps) : null,
    name_en: input.name_en?.toLowerCase() ?? null,
    category_id: input.category_id ?? null,
    unit: input.unit,
    cost_price: input.cost_price,
    sell_price: input.sell_price,
    stock_qty: input.stock_qty ?? 0,
    reorder_level: input.reorder_level ?? 5,
  })
  return db.prepare(`SELECT * FROM products WHERE id = ?`)
    .get(info.lastInsertRowid) as Product
}