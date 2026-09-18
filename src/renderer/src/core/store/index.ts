import type { Product, Sale, Customer, CustomerPayment, Supplier, UnitType } from '../types'
import { COMMON_CATALOG_ITEMS } from '../products/catalogData'

/**
 * Clean default starter commodities for fresh app installation.
 * Ensures POS and Inventory searches work instantly with realistic Afghan store goods.
 */
export const INITIAL_DEFAULT_PRODUCTS: Product[] = COMMON_CATALOG_ITEMS.slice(0, 25).map((item, index) => ({
  id: index + 1,
  barcode: item.barcode,
  name_fa: item.name_fa,
  name_ps: item.name_ps,
  name_en: item.name_en,
  category_id: index + 1,
  category_name: item.category,
  unit: item.unit,
  cost_price: item.suggested_cost,
  sell_price: item.suggested_price,
  stock_qty: item.default_stock,
  reorder_level: 10,
  is_active: 1,
  created_at: new Date().toISOString(),
}))

/**
 * Storage keys for persistent local shop data (offline cache / boot mirror)
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
// In-Memory Synchronous Cache backed by SQLite3
// -------------------------------------------------------------

let _products: Product[] = []
let _sales: Sale[] = []
let _customers: Customer[] = []
let _customerPayments: CustomerPayment[] = []
let _suppliers: Supplier[] = []
let _initialized = false

function getLocalStorageArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalStorageArray<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {}
}

/**
 * Hydrates store from localStorage initially, then immediately
 * pulls authoritative data from SQLite via Electron IPC.
 */
function ensureInitialized(): void {
  if (_initialized) return
  _initialized = true

  // Fast boot: load from localStorage cache first so UI never renders empty
  _products = getLocalStorageArray<Product>(STORAGE_KEYS.PRODUCTS)
  if (_products.length === 0) {
    _products = [...INITIAL_DEFAULT_PRODUCTS]
    saveLocalStorageArray(STORAGE_KEYS.PRODUCTS, _products)
  }

  _sales = getLocalStorageArray<Sale>(STORAGE_KEYS.SALES)
  _customers = getLocalStorageArray<Customer>(STORAGE_KEYS.CUSTOMERS)
  _customerPayments = getLocalStorageArray<CustomerPayment>(STORAGE_KEYS.CUSTOMER_PAYMENTS)
  _suppliers = getLocalStorageArray<Supplier>(STORAGE_KEYS.SUPPLIERS)

  // Asynchronously synchronize with SQLite3 in the background
  syncWithDatabase()
}

/**
 * Connects to SQLite via IPC:
 * 1. If SQLite is empty and localStorage has data, migrates all data into SQLite.
 * 2. Fetches authoritative tables from SQLite and updates memory + cache.
 */
async function syncWithDatabase(): Promise<void> {
  const api = (window as any).api
  if (!api?.db) return

  try {
    const dbData = await api.db.getAllData()
    const dbHasProducts = Array.isArray(dbData?.products) && dbData.products.length > 0

    if (!dbHasProducts) {
      // Database is empty — perform one-time migration from localStorage into SQLite
      const migrationDump = {
        products: _products,
        customers: _customers,
        suppliers: _suppliers,
        sales: _sales,
        customerPayments: _customerPayments,
      }
      await api.db.migrate(migrationDump)
    } else {
      // Database has authoritative data — hydrate in-memory store from SQLite
      _products = dbData.products || []
      _customers = dbData.customers || []
      _suppliers = dbData.suppliers || []
      _sales = dbData.sales || []
      _customerPayments = dbData.customerPayments || []

      // Mirror to localStorage for instant subsequent boots
      saveLocalStorageArray(STORAGE_KEYS.PRODUCTS, _products)
      saveLocalStorageArray(STORAGE_KEYS.CUSTOMERS, _customers)
      saveLocalStorageArray(STORAGE_KEYS.SUPPLIERS, _suppliers)
      saveLocalStorageArray(STORAGE_KEYS.SALES, _sales)
      saveLocalStorageArray(STORAGE_KEYS.CUSTOMER_PAYMENTS, _customerPayments)

      notifyListeners()
    }
  } catch (err) {
    console.warn('[store] Could not sync with SQLite database:', err)
  }
}

// -------------------------------------------------------------
// 1. Products & Inventory Store (backed by SQLite products & FTS5)
// -------------------------------------------------------------

export function getProducts(): Product[] {
  ensureInitialized()
  return _products
}

function saveProductsList(list: Product[]): void {
  _products = list
  saveLocalStorageArray(STORAGE_KEYS.PRODUCTS, list)
  notifyListeners()
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
  ensureInitialized()
  const current = _products
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

  saveProductsList([newProduct, ...current])

  // Persist into SQLite asynchronously
  const api = (window as any).api
  if (api?.products?.create) {
    api.products.create(input).then((saved: Product) => {
      if (saved && saved.id && saved.id !== newId) {
        _products = _products.map((p) => (p.id === newId ? { ...p, id: saved.id } : p))
        saveLocalStorageArray(STORAGE_KEYS.PRODUCTS, _products)
        notifyListeners()
      }
    }).catch(console.error)
  }

  return newProduct
}

export function updateProduct(id: number, updates: Partial<Product>): Product | null {
  ensureInitialized()
  const current = _products
  const idx = current.findIndex((p) => p.id === id)
  if (idx === -1) return null

  const updatedProduct: Product = {
    ...current[idx],
    ...updates,
  }

  current[idx] = updatedProduct
  saveProductsList([...current])

  // Persist into SQLite
  const api = (window as any).api
  if (api?.products?.update) {
    api.products.update(id, updates).catch(console.error)
  }

  return updatedProduct
}

export function deleteProduct(id: number): boolean {
  ensureInitialized()
  const current = _products
  const filtered = current.filter((p) => p.id !== id)
  if (filtered.length === current.length) return false
  saveProductsList(filtered)

  // Persist into SQLite
  const api = (window as any).api
  if (api?.products?.delete) {
    api.products.delete(id).catch(console.error)
  }

  return true
}

export function adjustProductStock(id: number, delta: number): Product | null {
  ensureInitialized()
  const current = _products
  const idx = current.findIndex((p) => p.id === id)
  if (idx === -1) return null

  const currentQty = current[idx].stock_qty || 0
  const updatedQty = Math.max(0, currentQty + delta)
  current[idx] = { ...current[idx], stock_qty: updatedQty }
  saveProductsList([...current])

  // Persist into SQLite
  const api = (window as any).api
  if (api?.products?.adjustStock) {
    api.products.adjustStock(id, delta).catch(console.error)
  }

  return current[idx]
}

// -------------------------------------------------------------
// 2. Sales & Orders Store (backed by SQLite sales & sale_items)
// -------------------------------------------------------------

export function getSales(): Sale[] {
  ensureInitialized()
  return _sales
}

function saveSalesList(list: Sale[]): void {
  _sales = list
  saveLocalStorageArray(STORAGE_KEYS.SALES, list)
  notifyListeners()
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
  ensureInitialized()
  const currentSales = _sales
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
  saveProductsList([...products])

  // If sale was on credit with a customer, increase debt balance
  if (saleData.payment_mode === 'credit' && saleData.customer_id) {
    const creditAddition = saleData.due > 0 ? saleData.due : saleData.total
    adjustCustomerBalance(saleData.customer_id, creditAddition)
  }

  // Save new sale
  saveSalesList([newSale, ...currentSales])

  // Persist into SQLite atomically via transaction
  const api = (window as any).api
  if (api?.sales?.record) {
    api.sales.record(saleData).then((savedSale: Sale) => {
      if (savedSale && savedSale.id && savedSale.id !== newId) {
        _sales = _sales.map((s) => (s.id === newId ? savedSale : s))
        saveLocalStorageArray(STORAGE_KEYS.SALES, _sales)
        notifyListeners()
      }
    }).catch(console.error)
  }

  return newSale
}

export const addSale = recordSale

export function deleteSale(id: number, restoreStock: boolean = true): boolean {
  ensureInitialized()
  const currentSales = _sales
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
    saveProductsList([...products])
  }

  // If sale was on credit with a customer, reverse the debt balance
  if (saleToDelete.payment_mode === 'credit' && saleToDelete.customer_id) {
    const creditReversal = saleToDelete.due > 0 ? saleToDelete.due : saleToDelete.total
    adjustCustomerBalance(saleToDelete.customer_id, -creditReversal)
  }

  const filtered = currentSales.filter((s) => s.id !== id)
  saveSalesList(filtered)

  // Persist into SQLite
  const api = (window as any).api
  if (api?.sales?.delete) {
    api.sales.delete(id, restoreStock).catch(console.error)
  }

  return true
}

// -------------------------------------------------------------
// 3. Customers Store (backed by SQLite customers)
// -------------------------------------------------------------

export function getCustomers(): Customer[] {
  ensureInitialized()
  return _customers
}

function saveCustomersList(list: Customer[]): void {
  _customers = list
  saveLocalStorageArray(STORAGE_KEYS.CUSTOMERS, list)
  notifyListeners()
}

export function addCustomer(input: {
  name: string
  phone?: string | null
  address?: string | null
  balance?: number
}): Customer {
  ensureInitialized()
  const current = _customers
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

  // Persist into SQLite
  const api = (window as any).api
  if (api?.customers?.create) {
    api.customers.create(input).then((saved: Customer) => {
      if (saved && saved.id && saved.id !== newId) {
        _customers = _customers.map((c) => (c.id === newId ? saved : c))
        saveLocalStorageArray(STORAGE_KEYS.CUSTOMERS, _customers)
        notifyListeners()
      }
    }).catch(console.error)
  }

  return newCust
}

export function deleteCustomer(id: number): boolean {
  ensureInitialized()
  const current = _customers
  const filtered = current.filter((c) => c.id !== id)
  if (filtered.length === current.length) return false
  saveCustomersList(filtered)

  // Persist into SQLite
  const api = (window as any).api
  if (api?.customers?.delete) {
    api.customers.delete(id).catch(console.error)
  }

  return true
}

export function updateCustomer(
  id: number,
  updates: Partial<Omit<Customer, 'id' | 'created_at'>>
): Customer | null {
  ensureInitialized()
  const current = _customers
  const idx = current.findIndex((c) => c.id === id)
  if (idx === -1) return null

  const updated: Customer = {
    ...current[idx],
    ...updates,
  }
  current[idx] = updated
  saveCustomersList([...current])

  // Persist into SQLite
  const api = (window as any).api
  if (api?.customers?.update) {
    api.customers.update(id, updates).catch(console.error)
  }

  return updated
}

export function adjustCustomerBalance(id: number, delta: number): Customer | null {
  ensureInitialized()
  const current = _customers
  const idx = current.findIndex((c) => c.id === id)
  if (idx === -1) return null

  current[idx] = {
    ...current[idx],
    balance: Math.round(((current[idx].balance || 0) + delta) * 100) / 100,
  }
  saveCustomersList([...current])

  // Persist into SQLite
  const api = (window as any).api
  if (api?.customers?.adjustBalance) {
    api.customers.adjustBalance(id, delta).catch(console.error)
  }

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
// 3.1 Customer Payments & Settlements Store (backed by SQLite)
// -------------------------------------------------------------

export function getCustomerPayments(customerId?: number): CustomerPayment[] {
  ensureInitialized()
  if (customerId != null) {
    return _customerPayments.filter((p) => p.customer_id === customerId)
  }
  return _customerPayments
}

function saveCustomerPaymentsList(list: CustomerPayment[]): void {
  _customerPayments = list
  saveLocalStorageArray(STORAGE_KEYS.CUSTOMER_PAYMENTS, list)
  notifyListeners()
}

export function recordCustomerPayment(
  customerId: number,
  amount: number,
  note?: string
): CustomerPayment | null {
  if (amount <= 0) return null
  ensureInitialized()
  const current = _customerPayments
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

  // Persist into SQLite
  const api = (window as any).api
  if (api?.customers?.recordPayment) {
    api.customers.recordPayment(customerId, amount, note).then((saved: CustomerPayment) => {
      if (saved && saved.id && saved.id !== newId) {
        _customerPayments = _customerPayments.map((p) => (p.id === newId ? saved : p))
        saveLocalStorageArray(STORAGE_KEYS.CUSTOMER_PAYMENTS, _customerPayments)
        notifyListeners()
      }
    }).catch(console.error)
  }

  return payment
}

export function deleteCustomerPayment(paymentId: number): boolean {
  ensureInitialized()
  const current = _customerPayments
  const payment = current.find((p) => p.id === paymentId)
  if (!payment) return false

  // Reverse customer debt adjustment
  adjustCustomerBalance(payment.customer_id, payment.amount)

  const filtered = current.filter((p) => p.id !== paymentId)
  saveCustomerPaymentsList(filtered)

  // Persist into SQLite
  const api = (window as any).api
  if (api?.customers?.deletePayment) {
    api.customers.deletePayment(paymentId).catch(console.error)
  }

  return true
}

// -------------------------------------------------------------
// 4. Suppliers Store (backed by SQLite suppliers)
// -------------------------------------------------------------

export function getSuppliers(): Supplier[] {
  ensureInitialized()
  return _suppliers
}

function saveSuppliersList(list: Supplier[]): void {
  _suppliers = list
  saveLocalStorageArray(STORAGE_KEYS.SUPPLIERS, list)
  notifyListeners()
}

export function addSupplier(input: {
  name: string
  company?: string | null
  phone?: string | null
  balance?: number
}): Supplier {
  ensureInitialized()
  const current = _suppliers
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

  // Persist into SQLite
  const api = (window as any).api
  if (api?.suppliers?.create) {
    api.suppliers.create(input).then((saved: Supplier) => {
      if (saved && saved.id && saved.id !== newId) {
        _suppliers = _suppliers.map((s) => (s.id === newId ? saved : s))
        saveLocalStorageArray(STORAGE_KEYS.SUPPLIERS, _suppliers)
        notifyListeners()
      }
    }).catch(console.error)
  }

  return newSup
}

export function deleteSupplier(id: number): boolean {
  ensureInitialized()
  const current = _suppliers
  const filtered = current.filter((s) => s.id !== id)
  if (filtered.length === current.length) return false
  saveSuppliersList(filtered)

  // Persist into SQLite
  const api = (window as any).api
  if (api?.suppliers?.delete) {
    api.suppliers.delete(id).catch(console.error)
  }

  return true
}

export function adjustSupplierBalance(id: number, delta: number): Supplier | null {
  ensureInitialized()
  const current = _suppliers
  const idx = current.findIndex((s) => s.id === id)
  if (idx === -1) return null

  current[idx] = {
    ...current[idx],
    balance: Math.round(((current[idx].balance || 0) + delta) * 100) / 100,
  }
  saveSuppliersList([...current])

  // Persist into SQLite
  const api = (window as any).api
  if (api?.suppliers?.adjustBalance) {
    api.suppliers.adjustBalance(id, delta).catch(console.error)
  }

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
      saveProductsList(data.products)
    }
    if (Array.isArray(data.sales)) {
      saveSalesList(data.sales)
    }
    if (Array.isArray(data.customers)) {
      saveCustomersList(data.customers)
    }
    if (Array.isArray(data.suppliers)) {
      saveSuppliersList(data.suppliers)
    }

    // Also push to SQLite
    const api = (window as any).api
    if (api?.db?.migrate) {
      api.db.migrate({
        products: data.products || [],
        customers: data.customers || [],
        suppliers: data.suppliers || [],
        sales: data.sales || [],
        customerPayments: [],
      }).catch(console.error)
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
