import * as XLSX from 'xlsx'
import {
  getProducts,
  getSales,
  getCustomers,
  getSuppliers,
} from './index'
import type { Product, Sale, SaleItem, Customer, Supplier } from '../types'

const STORAGE_KEYS = {
  PRODUCTS: 'hesabdar_products_v1',
  SALES: 'hesabdar_sales_v1',
  CUSTOMERS: 'hesabdar_customers_v1',
  SUPPLIERS: 'hesabdar_suppliers_v1',
} as const

/**
 * Generate a beautifully structured, multi-sheet Excel workbook
 * containing all shop datasets (Products, Customers, Suppliers, Sales, and Line Items).
 */
export function exportDatabaseToExcel(): Uint8Array {
  const products = getProducts()
  const sales = getSales()
  const customers = getCustomers()
  const suppliers = getSuppliers()

  const wb = XLSX.utils.book_new()

  // -------------------------------------------------------------
  // Sheet 1: Overview & Summary Dashboard
  // -------------------------------------------------------------
  const totalCost = products.reduce((sum, p) => sum + (p.cost_price || 0) * (p.stock_qty || 0), 0)
  const totalCustomerDebt = customers.reduce((sum, c) => sum + (c.balance || 0), 0)
  const totalSupplierDebt = suppliers.reduce((sum, s) => sum + (s.balance || 0), 0)
  const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0)

  const overviewData = [
    ['HESABDAR ACCOUNTING & POS SYSTEM — COMPLETE BACKUP'],
    ['Generated On', new Date().toLocaleString()],
    ['Application Version', '1.0.0 (Offline-First Edition)'],
    [''],
    ['KEY PERFORMANCE INDICATORS', 'COUNT / VALUE', 'UNIT'],
    ['Total Inventory Commodities', products.length, 'Items'],
    ['Total Completed Invoices', sales.length, 'Transactions'],
    ['Total Customer Accounts', customers.length, 'Accounts'],
    ['Total Wholesale Suppliers', suppliers.length, 'Vendors'],
    ['Total Inventory Asset Valuation (Cost Basis)', totalCost, 'AFN'],
    ['Total Customer Receivables (Outstanding Debt)', totalCustomerDebt, 'AFN'],
    ['Total Supplier Accounts Payable', totalSupplierDebt, 'AFN'],
    ['Total Gross Sales Turnover Recorded', totalRevenue, 'AFN'],
    [''],
    ['INSTRUCTIONS:'],
    ['1. This workbook contains the entire database across the sheets below.'],
    ['2. You can inspect or bulk edit items, customers, or vendor data in the sheets.'],
    ['3. You can upload this Excel file directly back into Hesabdar to restore all records.'],
  ]

  const wsOverview = XLSX.utils.aoa_to_sheet(overviewData)
  wsOverview['!cols'] = [{ wch: 44 }, { wch: 28 }, { wch: 16 }]
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview')

  // -------------------------------------------------------------
  // Sheet 2: Products & Inventory
  // -------------------------------------------------------------
  const productsRows = products.map((p) => ({
    ID: p.id,
    Barcode: p.barcode || '',
    'Name (Persian / Dari)': p.name_fa,
    'Name (English)': p.name_en || '',
    'Name (Pashto)': p.name_ps || '',
    Category: p.category_name || 'General',
    Unit: p.unit,
    'Cost Price (AFN)': p.cost_price,
    'Selling Price (AFN)': p.sell_price,
    'Stock Qty': p.stock_qty,
    'Reorder Level': p.reorder_level || 5,
    Active: p.is_active ? 1 : 0,
    'Created At': p.created_at,
  }))

  const wsProducts = XLSX.utils.json_to_sheet(productsRows)
  wsProducts['!cols'] = [
    { wch: 8 },
    { wch: 18 },
    { wch: 28 },
    { wch: 28 },
    { wch: 28 },
    { wch: 18 },
    { wch: 10 },
    { wch: 16 },
    { wch: 18 },
    { wch: 12 },
    { wch: 14 },
    { wch: 8 },
    { wch: 22 },
  ]
  XLSX.utils.book_append_sheet(wb, wsProducts, 'Products')

  // -------------------------------------------------------------
  // Sheet 3: Customers & Debt Ledger
  // -------------------------------------------------------------
  const customersRows = customers.map((c) => ({
    ID: c.id,
    'Customer Name': c.name,
    'Phone Number': c.phone || '',
    'Address / Area': c.address || '',
    'Outstanding Balance (Debt AFN)': c.balance || 0,
    'Registered Date': c.created_at,
  }))

  const wsCustomers = XLSX.utils.json_to_sheet(customersRows)
  wsCustomers['!cols'] = [
    { wch: 8 },
    { wch: 26 },
    { wch: 18 },
    { wch: 28 },
    { wch: 26 },
    { wch: 22 },
  ]
  XLSX.utils.book_append_sheet(wb, wsCustomers, 'Customers')

  // -------------------------------------------------------------
  // Sheet 4: Suppliers & Wholesale Payables
  // -------------------------------------------------------------
  const suppliersRows = suppliers.map((s) => ({
    ID: s.id,
    'Representative Name': s.name,
    'Company / Firm': s.company || '',
    'Phone Number': s.phone || '',
    'Payable Balance (We Owe AFN)': s.balance || 0,
    'Registered Date': s.created_at,
  }))

  const wsSuppliers = XLSX.utils.json_to_sheet(suppliersRows)
  wsSuppliers['!cols'] = [
    { wch: 8 },
    { wch: 26 },
    { wch: 24 },
    { wch: 18 },
    { wch: 26 },
    { wch: 22 },
  ]
  XLSX.utils.book_append_sheet(wb, wsSuppliers, 'Suppliers')

  // -------------------------------------------------------------
  // Sheet 5: Completed Sales Invoices
  // -------------------------------------------------------------
  const salesRows = sales.map((s) => ({
    ID: s.id,
    'Invoice Number': s.invoice_no,
    'Date & Time': s.created_at,
    'Customer ID': s.customer_id || '',
    'Payment Mode': s.payment_mode,
    'Subtotal (AFN)': s.subtotal,
    'Discount (AFN)': s.discount,
    'Total Payable (AFN)': s.total,
    'Paid Amount': s.paid,
    'Due Balance': s.due,
  }))

  const wsSales = XLSX.utils.json_to_sheet(salesRows)
  wsSales['!cols'] = [
    { wch: 8 },
    { wch: 18 },
    { wch: 22 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, wsSales, 'Sales')

  // -------------------------------------------------------------
  // Sheet 6: Sale Line Items Breakdown
  // -------------------------------------------------------------
  const itemsRows: Array<{
    'Sale ID': number
    'Invoice Number': string
    'Product ID': number
    'Product Name': string
    Quantity: number
    'Unit of Measure': string
    'Unit Price (AFN)': number
    'Cost Price (AFN)': number
    'Line Total (AFN)': number
  }> = []

  sales.forEach((s) => {
    s.items?.forEach((it) => {
      itemsRows.push({
        'Sale ID': s.id,
        'Invoice Number': s.invoice_no,
        'Product ID': it.product_id,
        'Product Name': it.product_name,
        Quantity: it.qty,
        'Unit of Measure': it.unit || 'pcs',
        'Unit Price (AFN)': it.unit_price,
        'Cost Price (AFN)': it.cost_price || 0,
        'Line Total (AFN)': it.line_total,
      })
    })
  })

  const wsItems = XLSX.utils.json_to_sheet(itemsRows)
  wsItems['!cols'] = [
    { wch: 10 },
    { wch: 18 },
    { wch: 12 },
    { wch: 28 },
    { wch: 12 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
  ]
  XLSX.utils.book_append_sheet(wb, wsItems, 'Sale_Items')

  // Generate binary Excel file buffer
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new Uint8Array(excelBuffer)
}

/**
 * Helper to convert binary Uint8Array to base64 string for Electron IPC.
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

/**
 * Helper to convert base64 string to Uint8Array.
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = window.atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

/**
 * Restore the entire database from an Excel workbook (.xlsx).
 * Parses Products, Customers, Suppliers, Sales, and Sale_Items sheets.
 */
export function importDatabaseFromExcel(raw: ArrayBuffer | Uint8Array | string): boolean {
  try {
    let data: ArrayBuffer | Uint8Array
    if (typeof raw === 'string') {
      data = base64ToUint8Array(raw)
    } else {
      data = raw
    }

    const workbook = XLSX.read(data, { type: 'array' })

    let importedProducts: Product[] = []
    let importedCustomers: Customer[] = []
    let importedSuppliers: Supplier[] = []
    let importedSales: Sale[] = []

    // 1. Parse Products
    const productsSheet = workbook.Sheets['Products']
    if (productsSheet) {
      const rows = XLSX.utils.sheet_to_json<any>(productsSheet)
      importedProducts = rows.map((r, idx) => ({
        id: Number(r['ID']) || idx + 1,
        barcode: r['Barcode'] ? String(r['Barcode']).trim() : null,
        name_fa: String(r['Name (Persian / Dari)'] || r['name_fa'] || r['Name'] || `Item ${idx + 1}`).trim(),
        name_en: r['Name (English)'] || r['name_en'] ? String(r['Name (English)'] || r['name_en']).trim() : null,
        name_ps: r['Name (Pashto)'] || r['name_ps'] ? String(r['Name (Pashto)'] || r['name_ps']).trim() : null,
        category_name: r['Category'] ? String(r['Category']).trim() : 'General',
        category_id: null,
        unit: (r['Unit'] || 'pcs') as any,
        cost_price: Number(r['Cost Price (AFN)'] ?? r['cost_price']) || 0,
        sell_price: Number(r['Selling Price (AFN)'] ?? r['sell_price']) || 0,
        stock_qty: Number(r['Stock Qty'] ?? r['stock_qty']) || 0,
        reorder_level: Number(r['Reorder Level'] ?? r['reorder_level']) || 5,
        is_active: r['Active'] !== undefined ? Number(r['Active']) : 1,
        created_at: r['Created At'] ? String(r['Created At']) : new Date().toISOString(),
      }))
    }

    // 2. Parse Customers
    const customersSheet = workbook.Sheets['Customers']
    if (customersSheet) {
      const rows = XLSX.utils.sheet_to_json<any>(customersSheet)
      importedCustomers = rows.map((r, idx) => ({
        id: Number(r['ID']) || idx + 1,
        name: String(r['Customer Name'] || r['name'] || `Customer ${idx + 1}`).trim(),
        phone: r['Phone Number'] || r['phone'] ? String(r['Phone Number'] || r['phone']).trim() : null,
        address: r['Address / Area'] || r['address'] ? String(r['Address / Area'] || r['address']).trim() : null,
        balance: Number(r['Outstanding Balance (Debt AFN)'] ?? r['balance']) || 0,
        created_at: r['Registered Date'] || r['created_at'] ? String(r['Registered Date'] || r['created_at']) : new Date().toISOString(),
      }))
    }

    // 3. Parse Suppliers
    const suppliersSheet = workbook.Sheets['Suppliers']
    if (suppliersSheet) {
      const rows = XLSX.utils.sheet_to_json<any>(suppliersSheet)
      importedSuppliers = rows.map((r, idx) => ({
        id: Number(r['ID']) || idx + 1,
        name: String(r['Representative Name'] || r['name'] || `Supplier ${idx + 1}`).trim(),
        company: r['Company / Firm'] || r['company'] ? String(r['Company / Firm'] || r['company']).trim() : null,
        phone: r['Phone Number'] || r['phone'] ? String(r['Phone Number'] || r['phone']).trim() : null,
        balance: Number(r['Payable Balance (We Owe AFN)'] ?? r['balance']) || 0,
        created_at: r['Registered Date'] || r['created_at'] ? String(r['Registered Date'] || r['created_at']) : new Date().toISOString(),
      }))
    }

    // 4. Parse Sales & Line Items
    const salesSheet = workbook.Sheets['Sales']
    const itemsSheet = workbook.Sheets['Sale_Items']

    // Build items map by sale_id or invoice_no
    const itemsBySaleId = new Map<number, SaleItem[]>()
    const itemsByInvoiceNo = new Map<string, SaleItem[]>()

    if (itemsSheet) {
      const itemRows = XLSX.utils.sheet_to_json<any>(itemsSheet)
      itemRows.forEach((r) => {
        const saleId = Number(r['Sale ID'])
        const invoiceNo = String(r['Invoice Number'] || '').trim()

        const item: SaleItem = {
          product_id: Number(r['Product ID']) || 0,
          product_name: String(r['Product Name'] || 'Item'),
          qty: Number(r['Quantity']) || 1,
          unit: r['Unit of Measure'] || 'pcs',
          unit_price: Number(r['Unit Price (AFN)']) || 0,
          cost_price: Number(r['Cost Price (AFN)']) || 0,
          line_total: Number(r['Line Total (AFN)']) || 0,
        }

        if (saleId) {
          if (!itemsBySaleId.has(saleId)) itemsBySaleId.set(saleId, [])
          itemsBySaleId.get(saleId)!.push(item)
        }
        if (invoiceNo) {
          if (!itemsByInvoiceNo.has(invoiceNo)) itemsByInvoiceNo.set(invoiceNo, [])
          itemsByInvoiceNo.get(invoiceNo)!.push(item)
        }
      })
    }

    if (salesSheet) {
      const salesRows = XLSX.utils.sheet_to_json<any>(salesSheet)
      importedSales = salesRows.map((r, idx) => {
        const id = Number(r['ID']) || idx + 1
        const invoiceNo = String(r['Invoice Number'] || `INV-${10000 + id}`).trim()
        const items = itemsBySaleId.get(id) || itemsByInvoiceNo.get(invoiceNo) || []

        return {
          id,
          invoice_no: invoiceNo,
          created_at: r['Date & Time'] || r['created_at'] ? String(r['Date & Time'] || r['created_at']) : new Date().toISOString(),
          customer_id: r['Customer ID'] ? Number(r['Customer ID']) : null,
          payment_mode: (r['Payment Mode'] || 'cash') as any,
          subtotal: Number(r['Subtotal (AFN)'] ?? r['subtotal']) || 0,
          discount: Number(r['Discount (AFN)'] ?? r['discount']) || 0,
          total: Number(r['Total Payable (AFN)'] ?? r['total']) || 0,
          paid: Number(r['Paid Amount'] ?? r['paid']) || 0,
          due: Number(r['Due Balance'] ?? r['due']) || 0,
          items,
        }
      })
    }

    // Persist to local storage
    if (importedProducts.length > 0) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(importedProducts))
    }
    if (importedCustomers.length > 0) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(importedCustomers))
    }
    if (importedSuppliers.length > 0) {
      localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(importedSuppliers))
    }
    if (importedSales.length > 0) {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(importedSales))
    }

    return true
  } catch (err) {
    console.error('Failed to import Excel backup:', err)
    return false
  }
}
