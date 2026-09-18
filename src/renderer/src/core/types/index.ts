export type UnitType = 'kg' | 'pcs' | 'litre' | 'pack' | 'box' | 'meter'

export interface Product {
  id: number
  barcode: string | null
  name_fa: string
  name_ps: string | null
  name_en: string | null
  category_id: number | null
  category_name?: string
  unit: UnitType
  cost_price: number
  sell_price: number
  stock_qty: number
  reorder_level: number
  is_active: number
  created_at: string
}

export interface Category {
  id: number
  name_fa: string
  name_ps?: string | null
  name_en?: string | null
}

export interface CatalogItem {
  id: string
  barcode: string
  name_fa: string
  name_ps: string
  name_en: string
  unit: UnitType
  category: string
  suggested_cost: number
  suggested_price: number
  default_stock: number
}

export interface Customer {
  id: number
  name: string
  phone: string | null
  balance: number // positive = owes us
  address?: string | null
  created_at: string
}

export interface CustomerPayment {
  id: number
  customer_id: number
  customer_name?: string
  amount: number
  note?: string
  created_at: string
}

export interface Supplier {
  id: number
  name: string
  phone: string | null
  balance: number // positive = we owe them
  company?: string | null
  created_at: string
}

export interface SaleItem {
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

export type PaymentMode = 'cash' | 'card' | 'credit' | 'bank'

export interface Sale {
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
  payment_mode: PaymentMode
  items: SaleItem[]
  created_at: string
}

export type CartItem = SaleItem


export interface TimeSeriesPoint {
  label: string
  date: string
  revenue: number
  profit: number
  orders: number
}

export interface AnalyticsSummary {
  totalRevenue: number
  totalProfit: number
  totalOrders: number
  averageOrderValue: number
  profitMarginPercentage: number
  revenueGrowthRate: number
  profitGrowthRate: number
}

export type GraphPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface AppSettings {
  storeName: string
  phone: string
  currency: string
  taxRate: number
  userIcon: string | null
  language: string
}
