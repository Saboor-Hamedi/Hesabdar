import type { Product, Sale, Customer, CustomerPayment, Supplier, UnitType } from '../types'

/**
 * Storage keys for persistent local shop data
 */
const STORAGE_KEYS = {
  PRODUCTS: 'hesabdar_products_v1',
  SALES: 'hesabdar_sales_v1',
  CUSTOMERS: 'hesabdar_customers_v1',
  CUSTOMER_PAYMENTS: 'hesabdar_customer_payments_v1',
  SUPPLIERS: 'hesabdar_suppliers_v1',
} as const

// Event listeners for store changes
type StoreListener = () => void
const listeners = new Set<StoreListener>()

function notifyListeners(): void {
  listeners.forEach((fn) => {
    try {
      fn()
    } catch (err) {
      console.error('Store listener error:', err)
    }
  })
}

export function onStoreChange(callback: StoreListener): () => void {
  listeners.add(callback)
  return () => {
    listeners.delete(callback)
  }
}

// -------------------------------------------------------------
// 1. Products & Inventory Store
// -------------------------------------------------------------

export function getProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS)
    if (!raw) return []
    return JSON.parse(raw) as Product[]
  } catch (err) {
    console.error('Failed to load products from store:', err)
    return []
  }
}

function saveProductsList(list: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(list))
    notifyListeners()
  } catch (err) {
    console.error('Failed to save products to store:', err)
  }
}

export function addProduct(input: {
  barcode?: string | null
  name_fa: string
  name_ps?: string | null
  name_en?: string | null
  category_id?: number | null
  category_name?: string | null
  unit?: UnitType
  cost_price: number
  sell_price: number
  stock_qty: number
  reorder_level?: number
}): Product {
  const current = getProducts()
  const newId = current.length > 0 ? Math.max(...current.map((p) => p.id)) + 1 : 1

  const newProduct: Product = {
    id: newId,
    barcode: input.barcode ? input.barcode.trim() : null,
    name_fa: input.name_fa.trim(),
    name_ps: input.name_ps ? input.name_ps.trim() : null,
    name_en: input.name_en ? input.name_en.trim() : null,
    category_id: input.category_id ?? null,
    category_name: input.category_name ?? 'General',
    unit: input.unit ?? 'pcs',
    cost_price: Number(input.cost_price) || 0,
    sell_price: Number(input.sell_price) || 0,
    stock_qty: Number(input.stock_qty) || 0,
    reorder_level: Number(input.reorder_level) || 5,
    is_active: 1,
    created_at: new Date().toISOString(),
  }

  const updated = [newProduct, ...current]
  saveProductsList(updated)
  return newProduct
}

export function updateProduct(id: number, updates: Partial<Product>): Product | null {
  const current = getProducts()
  const idx = current.findIndex((p) => p.id === id)
  if (idx === -1) return null

  const updatedProduct: Product = {
    ...current[idx],
    ...updates,
  }

  current[idx] = updatedProduct
  saveProductsList(current)
  return updatedProduct
}

export function deleteProduct(id: number): boolean {
  const current = getProducts()
  const filtered = current.filter((p) => p.id !== id)
  if (filtered.length === current.length) return false
  saveProductsList(filtered)
  return true
}

export function adjustProductStock(id: number, delta: number): Product | null {
  const current = getProducts()
  const idx = current.findIndex((p) => p.id === id)
  if (idx === -1) return null

  const currentQty = current[idx].stock_qty || 0
  const updatedQty = Math.max(0, currentQty + delta)
  current[idx] = { ...current[idx], stock_qty: updatedQty }
  saveProductsList(current)
  return current[idx]
}

// -------------------------------------------------------------
// 2. Sales & Orders Store
// -------------------------------------------------------------

export function getSales(): Sale[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SALES)
    if (!raw) return []
    return JSON.parse(raw) as Sale[]
  } catch (err) {
    console.error('Failed to load sales from store:', err)
    return []
  }
}

function saveSalesList(list: Sale[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(list))
    notifyListeners()
  } catch (err) {
    console.error('Failed to save sales to store:', err)
  }
}

export function recordSale(saleData: {
  customer_id?: number | null
  subtotal: number
  discount: number
  total: number
  paid: number
  due: number
  payment_mode: 'cash' | 'card' | 'credit' | 'bank'
  items: Array<{
    product_id: number
    product_name: string
    qty: number
    unit?: UnitType | string
    unit_price: number
    cost_price: number
    line_total: number
  }>
}): Sale {
  const currentSales = getSales()
  const newId = currentSales.length > 0 ? Math.max(...currentSales.map((s) => s.id)) + 1 : 1
  const invoiceNo = `INV-${String(10000 + newId)}`

  // Lookup customer details if associated
  const customers = getCustomers()
  const matchedCustomer = saleData.customer_id
    ? customers.find((c) => c.id === saleData.customer_id)
    : null

  const newSale: Sale = {
    id: newId,
    invoice_no: invoiceNo,
    customer_id: saleData.customer_id ?? null,
    customer_name: matchedCustomer?.name,
    customer_phone: matchedCustomer?.phone,
    subtotal: saleData.subtotal,
    discount: saleData.discount,
    total: saleData.total,
    paid: saleData.paid,
    due: saleData.due,
    payment_mode: saleData.payment_mode,
    items: saleData.items,
    created_at: new Date().toISOString(),
  }

  // Automatically decrement inventory stock amounts for sold items
  const products = getProducts()
  saleData.items.forEach((it) => {
    const p = products.find((prod) => prod.id === it.product_id)
    if (p) {
      p.stock_qty = Math.max(0, (p.stock_qty || 0) - it.qty)
    }
  })
  saveProductsList(products)

  // If sale was on credit with a customer, increase that customer's debt balance by the unpaid amount
  if (saleData.payment_mode === 'credit' && saleData.customer_id) {
    const creditAddition = saleData.due > 0 ? saleData.due : saleData.total
    adjustCustomerBalance(saleData.customer_id, creditAddition)
  }

  // Save new sale
  const updatedSales = [newSale, ...currentSales]
  saveSalesList(updatedSales)

  return newSale
}

export const addSale = recordSale

export function deleteSale(id: number, restoreStock: boolean = true): boolean {
  const currentSales = getSales()
  const saleToDelete = currentSales.find((s) => s.id === id)
  if (!saleToDelete) return false

  if (restoreStock && saleToDelete.items?.length) {
    const products = getProducts()
    saleToDelete.items.forEach((it) => {
      const p = products.find((prod) => prod.id === it.product_id)
      if (p) {
        p.stock_qty = (p.stock_qty || 0) + it.qty
      }
    })
    saveProductsList(products)
  }

  // If sale was on credit with a customer, reverse the debt balance
  if (saleToDelete.payment_mode === 'credit' && saleToDelete.customer_id) {
    const creditReversal = saleToDelete.due > 0 ? saleToDelete.due : saleToDelete.total
    adjustCustomerBalance(saleToDelete.customer_id, -creditReversal)
  }

  const filtered = currentSales.filter((s) => s.id !== id)
  saveSalesList(filtered)
  return true
}

// -------------------------------------------------------------
// 3. Customers Store
// -------------------------------------------------------------

export function getCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS)
    if (!raw) return []
    return JSON.parse(raw) as Customer[]
  } catch (err) {
    console.error('Failed to load customers from store:', err)
    return []
  }
}

function saveCustomersList(list: Customer[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(list))
    notifyListeners()
  } catch (err) {
    console.error('Failed to save customers to store:', err)
  }
}

export function addCustomer(input: {
  name: string
  phone?: string | null
  address?: string | null
  balance?: number
}): Customer {
  const current = getCustomers()
  const newId = current.length > 0 ? Math.max(...current.map((c) => c.id)) + 1 : 1

  const newCust: Customer = {
    id: newId,
    name: input.name.trim(),
    phone: input.phone ? input.phone.trim() : null,
    address: input.address ? input.address.trim() : null,
    balance: Number(input.balance) || 0,
    created_at: new Date().toISOString(),
  }

  saveCustomersList([newCust, ...current])
  return newCust
}

export function deleteCustomer(id: number): boolean {
  const current = getCustomers()
  const filtered = current.filter((c) => c.id !== id)
  if (filtered.length === current.length) return false
  saveCustomersList(filtered)
  return true
}

export function updateCustomer(
  id: number,
  updates: Partial<Omit<Customer, 'id' | 'created_at'>>
): Customer | null {
  const current = getCustomers()
  const idx = current.findIndex((c) => c.id === id)
  if (idx === -1) return null

  const updated: Customer = {
    ...current[idx],
    ...updates,
  }
  current[idx] = updated
  saveCustomersList(current)
  return updated
}

export function adjustCustomerBalance(id: number, delta: number): Customer | null {
  const current = getCustomers()
  const idx = current.findIndex((c) => c.id === id)
  if (idx === -1) return null

  current[idx] = {
    ...current[idx],
    balance: Math.round(((current[idx].balance || 0) + delta) * 100) / 100,
  }
  saveCustomersList(current)
  return current[idx]
}

export interface StoreSettings {
  storeName: string
  phone?: string
  address?: string
  currency: string
  taxRate: number
  language?: string
}

export function getSettings(): StoreSettings {
  try {
    const cached = localStorage.getItem('hesabdar_store_profile')
    if (cached) return JSON.parse(cached)
  } catch {}
  return {
    storeName: 'Hesabdar Supermarket',
    phone: '0799123456',
    address: 'Kabul, Afghanistan',
    currency: 'AFN',
    taxRate: 0,
    language: 'en',
  }
}

// -------------------------------------------------------------
// 3.1 Customer Payments & Settlements Store
// -------------------------------------------------------------

export function getCustomerPayments(customerId?: number): CustomerPayment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMER_PAYMENTS)
    if (!raw) return []
    const payments = JSON.parse(raw) as CustomerPayment[]
    if (customerId != null) {
      return payments.filter((p) => p.customer_id === customerId)
    }
    return payments
  } catch (err) {
    console.error('Failed to load customer payments from store:', err)
    return []
  }
}

function saveCustomerPaymentsList(list: CustomerPayment[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOMER_PAYMENTS, JSON.stringify(list))
    notifyListeners()
  } catch (err) {
    console.error('Failed to save customer payments to store:', err)
  }
}

export function recordCustomerPayment(
  customerId: number,
  amount: number,
  note?: string
): CustomerPayment | null {
  if (amount <= 0) return null
  const current = getCustomerPayments()
  const customers = getCustomers()
  const customer = customers.find((c) => c.id === customerId)
  if (!customer) return null

  const newId = current.length > 0 ? Math.max(...current.map((p) => p.id)) + 1 : 1
  const payment: CustomerPayment = {
    id: newId,
    customer_id: customerId,
    customer_name: customer.name,
    amount: Math.round(amount * 100) / 100,
    note: note || 'Customer debt settlement payment',
    created_at: new Date().toISOString(),
  }

  // Reduce customer debt balance
  adjustCustomerBalance(customerId, -amount)

  // Save payment record
  saveCustomerPaymentsList([payment, ...current])
  return payment
}

export function deleteCustomerPayment(paymentId: number): boolean {
  const current = getCustomerPayments()
  const payment = current.find((p) => p.id === paymentId)
  if (!payment) return false

  // Reverse customer debt adjustment
  adjustCustomerBalance(payment.customer_id, payment.amount)

  const filtered = current.filter((p) => p.id !== paymentId)
  saveCustomerPaymentsList(filtered)
  return true
}

// -------------------------------------------------------------
// 4. Suppliers Store
// -------------------------------------------------------------

export function getSuppliers(): Supplier[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUPPLIERS)
    if (!raw) return []
    return JSON.parse(raw) as Supplier[]
  } catch (err) {
    console.error('Failed to load suppliers from store:', err)
    return []
  }
}

function saveSuppliersList(list: Supplier[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(list))
    notifyListeners()
  } catch (err) {
    console.error('Failed to save suppliers to store:', err)
  }
}

export function addSupplier(input: {
  name: string
  company?: string | null
  phone?: string | null
  balance?: number
}): Supplier {
  const current = getSuppliers()
  const newId = current.length > 0 ? Math.max(...current.map((s) => s.id)) + 1 : 1

  const newSup: Supplier = {
    id: newId,
    name: input.name.trim(),
    company: input.company ? input.company.trim() : null,
    phone: input.phone ? input.phone.trim() : null,
    balance: Number(input.balance) || 0,
    created_at: new Date().toISOString(),
  }

  saveSuppliersList([newSup, ...current])
  return newSup
}

export function deleteSupplier(id: number): boolean {
  const current = getSuppliers()
  const filtered = current.filter((s) => s.id !== id)
  if (filtered.length === current.length) return false
  saveSuppliersList(filtered)
  return true
}

export function adjustSupplierBalance(id: number, delta: number): Supplier | null {
  const current = getSuppliers()
  const idx = current.findIndex((s) => s.id === id)
  if (idx === -1) return null

  current[idx] = {
    ...current[idx],
    balance: Math.round(((current[idx].balance || 0) + delta) * 100) / 100,
  }
  saveSuppliersList(current)
  return current[idx]
}

// -------------------------------------------------------------
// 5. Database Backup & Restore Facilities
// -------------------------------------------------------------

export function exportDatabaseBackup(): string {
  const data = {
    app: 'Hesabdar',
    version: '1.0.0',
    exported_at: new Date().toISOString(),
    products: getProducts(),
    sales: getSales(),
    customers: getCustomers(),
    suppliers: getSuppliers(),
  }
  return JSON.stringify(data, null, 2)
}

export function importDatabaseBackup(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString)
    if (Array.isArray(data.products)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products))
    }
    if (Array.isArray(data.sales)) {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(data.sales))
    }
    if (Array.isArray(data.customers)) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(data.customers))
    }
    if (Array.isArray(data.suppliers)) {
      localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(data.suppliers))
    }
    notifyListeners()
    return true
  } catch (err) {
    console.error('Failed to import database backup:', err)
    return false
  }
}

export {
  exportDatabaseToExcel,
  importDatabaseFromExcel,
  uint8ArrayToBase64,
  base64ToUint8Array,
} from './excelBackup'

