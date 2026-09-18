/**
 * src/main/db/customers.ts
 * Customer CRUD + balance operations + payments
 */

import { getDb } from './index'

export interface DbCustomer {
  id: number
  name: string
  phone: string | null
  address: string | null
  balance: number
  created_at: string
}

export interface DbCustomerPayment {
  id: number
  customer_id: number
  customer_name?: string
  amount: number
  note: string | null
  created_at: string
}

export function getAllCustomers(): DbCustomer[] {
  return getDb().prepare(`SELECT * FROM customers ORDER BY id DESC`).all() as DbCustomer[]
}

export function createCustomer(input: {
  name: string
  phone?: string | null
  address?: string | null
  balance?: number
}): DbCustomer {
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO customers (name, phone, balance)
    VALUES (?, ?, ?)
  `).run(input.name.trim(), input.phone?.trim() || null, Number(input.balance) || 0)
  return db.prepare(`SELECT * FROM customers WHERE id = ?`).get(result.lastInsertRowid) as DbCustomer
}

export function updateCustomer(id: number, updates: Partial<Omit<DbCustomer, 'id' | 'created_at'>>): DbCustomer | null {
  const db = getDb()
  const fields: string[] = []
  const values: unknown[] = []
  if ('name' in updates) { fields.push('name = ?'); values.push(updates.name) }
  if ('phone' in updates) { fields.push('phone = ?'); values.push(updates.phone ?? null) }
  if ('address' in updates) { fields.push('address = ?'); values.push(updates.address ?? null) }
  if ('balance' in updates) { fields.push('balance = ?'); values.push(updates.balance) }
  if (!fields.length) return null
  values.push(id)
  db.prepare(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  return db.prepare(`SELECT * FROM customers WHERE id = ?`).get(id) as DbCustomer
}

export function deleteCustomer(id: number): boolean {
  const result = getDb().prepare(`DELETE FROM customers WHERE id = ?`).run(id)
  return result.changes > 0
}

export function adjustCustomerBalance(id: number, delta: number): DbCustomer | null {
  const db = getDb()
  db.prepare(`UPDATE customers SET balance = ROUND(balance + ?, 2) WHERE id = ?`).run(delta, id)
  return db.prepare(`SELECT * FROM customers WHERE id = ?`).get(id) as DbCustomer | null
}

// Customer Payments ──────────────────────────────────────────────────────────

export function getCustomerPayments(customerId?: number): DbCustomerPayment[] {
  const db = getDb()
  if (customerId != null) {
    return db.prepare(`
      SELECT cp.*, c.name as customer_name
      FROM customer_payments cp
      JOIN customers c ON cp.customer_id = c.id
      WHERE cp.customer_id = ?
      ORDER BY cp.id DESC
    `).all(customerId) as DbCustomerPayment[]
  }
  return db.prepare(`
    SELECT cp.*, c.name as customer_name
    FROM customer_payments cp
    JOIN customers c ON cp.customer_id = c.id
    ORDER BY cp.id DESC
  `).all() as DbCustomerPayment[]
}

export function recordCustomerPayment(
  customerId: number,
  amount: number,
  note?: string
): DbCustomerPayment | null {
  if (amount <= 0) return null
  const db = getDb()
  const customer = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(customerId) as DbCustomer | undefined
  if (!customer) return null

  const recordPayment = db.transaction(() => {
    const res = db.prepare(`
      INSERT INTO customer_payments (customer_id, amount, note)
      VALUES (?, ?, ?)
    `).run(customerId, Math.round(amount * 100) / 100, note || 'Customer debt settlement payment')

    db.prepare(`UPDATE customers SET balance = ROUND(balance - ?, 2) WHERE id = ?`).run(amount, customerId)
    return res.lastInsertRowid
  })

  const newId = recordPayment()
  return db.prepare(`
    SELECT cp.*, c.name as customer_name
    FROM customer_payments cp
    JOIN customers c ON cp.customer_id = c.id
    WHERE cp.id = ?
  `).get(newId) as DbCustomerPayment
}

export function deleteCustomerPayment(paymentId: number): boolean {
  const db = getDb()
  const payment = db.prepare(`SELECT * FROM customer_payments WHERE id = ?`).get(paymentId) as DbCustomerPayment | undefined
  if (!payment) return false

  const doDelete = db.transaction(() => {
    db.prepare(`UPDATE customers SET balance = ROUND(balance + ?, 2) WHERE id = ?`)
      .run(payment.amount, payment.customer_id)
    db.prepare(`DELETE FROM customer_payments WHERE id = ?`).run(paymentId)
  })
  doDelete()
  return true
}
