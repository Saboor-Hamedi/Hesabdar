import type { HeldCart } from './types'

const STORAGE_KEY = 'hesabdar_held_carts'

/**
 * Retrieves all held carts from localStorage.
 */
export function getHeldCarts(): HeldCart[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('Failed to load held carts from localStorage:', err)
    return []
  }
}

/**
 * Saves a new held cart into localStorage.
 * Guarantees all fields are strictly sanitized primitives to prevent any circular reference errors.
 */
export function saveHeldCart(data: Omit<HeldCart, 'id' | 'createdAt'>): HeldCart {
  const heldCarts = getHeldCarts()

  const sanitizedItems = (data.items || []).map((it) => ({
    product_id: Number(it.product_id),
    product_name: String(it.product_name || 'Item'),
    qty: Number(it.qty) || 1,
    unit: it.unit ? String(it.unit) : 'pcs',
    unit_price: Number(it.unit_price) || 0,
    cost_price: Number(it.cost_price || 0),
    line_total: Number(it.line_total) || 0,
  }))

  const cleanNote = typeof data.note === 'string' ? data.note.trim() : undefined
  const cleanCustomerName = typeof data.customerName === 'string' ? data.customerName.trim() : undefined

  const newCart: HeldCart = {
    id: `held_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    items: sanitizedItems,
    customerId: typeof data.customerId === 'number' ? data.customerId : null,
    customerName: cleanCustomerName,
    discount: Number(data.discount) || 0,
    paymentMode: data.paymentMode || 'cash',
    subtotal: Number(data.subtotal) || 0,
    total: Number(data.total) || 0,
    note: cleanNote,
  }

  const updated = [newCart, ...heldCarts]
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to save held cart to localStorage:', err)
  }
  return newCart
}

/**
 * Removes a specific held cart from localStorage by its unique ID.
 */
export function removeHeldCart(id: string): void {
  const heldCarts = getHeldCarts()
  const filtered = heldCarts.filter((c) => c.id !== id)
  try {
    if (filtered.length === 0) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    }
  } catch (err) {
    console.error('Failed to remove held cart from localStorage:', err)
  }
}

/**
 * Clears all held carts from localStorage.
 */
export function clearAllHeldCarts(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    console.error('Failed to clear held carts from localStorage:', err)
  }
}
