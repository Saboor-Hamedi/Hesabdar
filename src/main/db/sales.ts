/**
 * src/main/db/sales.ts
 *
 * Record a sale as a single atomic transaction:
 *   1. Insert into sales
 *   2. Insert all sale_items
 *   3. Decrement stock_qty for each product
 *   4. If credit sale — increase customer balance (debt)
 */

import { getDb } from './index'
import type { UnitType } from '../../renderer/src/core/types'

export interface DbSaleItem {
  id?: number
  sale_id?: number
  product_id: number
  product_name: string
  qty: number
  unit?: UnitType | string
  unit_price: number
  cost_price: number
  line_total: number
}

export interface DbSale {
  id: number
  invoice_no: string
  customer_id: number | null
  customer_name?: string
  customer_phone?: string | null
  subtotal: number
  discount: number
  total: number
  paid: number
  due: number
  payment_mode: string
  items: DbSaleItem[]
  created_at: string
}

export function getAllSales(): DbSale[] {
  const db = getDb()
  const rows = db.prepare(`
    SELECT s.*, c.name as customer_name, c.phone as customer_phone
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    ORDER BY s.id DESC
  `).all() as Omit<DbSale, 'items'>[]

  const getItems = db.prepare(`
    SELECT si.*, COALESCE(p.name_fa, p.name_en, p.name_ps, 'Product #' || si.product_id) as product_name, p.unit as unit
    FROM sale_items si
    LEFT JOIN products p ON si.product_id = p.id
    WHERE si.sale_id = ?
  `)
  return rows.map((row) => ({
    ...row,
    items: getItems.all(row.id) as DbSaleItem[],
  }))
}

export function recordSale(saleData: {
  customer_id?: number | null
  subtotal: number
  discount: number
  total: number
  paid: number
  due: number
  payment_mode: string
  items: DbSaleItem[]
}): DbSale {
  const db = getDb()

  const doRecord = db.transaction(() => {
    // Generate invoice number
    const countRow = db.prepare(`SELECT COUNT(*) as cnt FROM sales`).get() as { cnt: number }
    const invoiceNo = `INV-${String(10000 + countRow.cnt + 1)}`

    // Insert sale header
    const saleResult = db.prepare(`
      INSERT INTO sales (invoice_no, customer_id, user_id, subtotal, discount, total, paid, due, payment_mode)
      VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?)
    `).run(
      invoiceNo,
      saleData.customer_id ?? null,
      saleData.subtotal,
      saleData.discount,
      saleData.total,
      saleData.paid,
      saleData.due,
      saleData.payment_mode,
    )
    const saleId = saleResult.lastInsertRowid as number

    const insertItem = db.prepare(`
      INSERT INTO sale_items (sale_id, product_id, qty, unit_price, cost_price, line_total)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    const deductStock = db.prepare(`
      UPDATE products SET stock_qty = MAX(0, stock_qty - ?) WHERE id = ?
    `)

    for (const item of saleData.items) {
      insertItem.run(saleId, item.product_id, item.qty, item.unit_price, item.cost_price, item.line_total)
      deductStock.run(item.qty, item.product_id)
    }

    // Credit sale: increase customer debt balance
    if (saleData.payment_mode === 'credit' && saleData.customer_id) {
      const creditAmount = saleData.due > 0 ? saleData.due : saleData.total
      db.prepare(`UPDATE customers SET balance = ROUND(balance + ?, 2) WHERE id = ?`)
        .run(creditAmount, saleData.customer_id)
    }

    return saleId
  })

  const saleId = doRecord()

  const sale = db.prepare(`
    SELECT s.*, c.name as customer_name, c.phone as customer_phone
    FROM sales s LEFT JOIN customers c ON s.customer_id = c.id
    WHERE s.id = ?
  `).get(saleId) as Omit<DbSale, 'items'>

  const items = db.prepare(`
    SELECT si.*, COALESCE(p.name_fa, p.name_en, p.name_ps, 'Product #' || si.product_id) as product_name, p.unit as unit
    FROM sale_items si
    LEFT JOIN products p ON si.product_id = p.id
    WHERE si.sale_id = ?
  `).all(saleId) as DbSaleItem[]
  return { ...sale, items }
}

export function deleteSale(id: number, restoreStock = true): boolean {
  const db = getDb()
  const sale = db.prepare(`SELECT * FROM sales WHERE id = ?`).get(id) as Omit<DbSale, 'items'> | undefined
  if (!sale) return false

  const items = db.prepare(`SELECT * FROM sale_items WHERE sale_id = ?`).all(id) as DbSaleItem[]

  const doDelete = db.transaction(() => {
    if (restoreStock) {
      const restoreStmt = db.prepare(`UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?`)
      for (const item of items) {
        restoreStmt.run(item.qty, item.product_id)
      }
    }

    // Reverse customer credit debt if applicable
    if (sale.payment_mode === 'credit' && sale.customer_id) {
      const creditAmount = sale.due > 0 ? sale.due : sale.total
      db.prepare(`UPDATE customers SET balance = ROUND(balance - ?, 2) WHERE id = ?`)
        .run(creditAmount, sale.customer_id)
    }

    db.prepare(`DELETE FROM sales WHERE id = ?`).run(id)
  })

  doDelete()
  return true
}
