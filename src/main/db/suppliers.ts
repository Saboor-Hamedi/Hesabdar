/**
 * src/main/db/suppliers.ts
 * Supplier CRUD + balance adjustments
 */

import { getDb } from './index'

export interface DbSupplier {
  id: number
  name: string
  company: string | null
  phone: string | null
  balance: number // positive = we owe them
  created_at: string
}

export function getAllSuppliers(): DbSupplier[] {
  return getDb().prepare(`SELECT * FROM suppliers ORDER BY id DESC`).all() as DbSupplier[]
}

export function createSupplier(input: {
  name: string
  company?: string | null
  phone?: string | null
  balance?: number
}): DbSupplier {
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO suppliers (name, phone, balance)
    VALUES (?, ?, ?)
  `).run(input.name.trim(), input.phone?.trim() || null, Number(input.balance) || 0)
  return db.prepare(`SELECT * FROM suppliers WHERE id = ?`).get(result.lastInsertRowid) as DbSupplier
}

export function updateSupplier(id: number, updates: Partial<Omit<DbSupplier, 'id' | 'created_at'>>): DbSupplier | null {
  const db = getDb()
  const fields: string[] = []
  const values: unknown[] = []
  if ('name' in updates) { fields.push('name = ?'); values.push(updates.name) }
  if ('company' in updates) { fields.push('company = ?'); values.push(updates.company ?? null) }
  if ('phone' in updates) { fields.push('phone = ?'); values.push(updates.phone ?? null) }
  if ('balance' in updates) { fields.push('balance = ?'); values.push(updates.balance) }
  if (!fields.length) return null
  values.push(id)
  db.prepare(`UPDATE suppliers SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  return db.prepare(`SELECT * FROM suppliers WHERE id = ?`).get(id) as DbSupplier
}

export function deleteSupplier(id: number): boolean {
  const result = getDb().prepare(`DELETE FROM suppliers WHERE id = ?`).run(id)
  return result.changes > 0
}

export function adjustSupplierBalance(id: number, delta: number): DbSupplier | null {
  const db = getDb()
  db.prepare(`UPDATE suppliers SET balance = ROUND(balance + ?, 2) WHERE id = ?`).run(delta, id)
  return db.prepare(`SELECT * FROM suppliers WHERE id = ?`).get(id) as DbSupplier | null
}
