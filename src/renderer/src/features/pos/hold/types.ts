import type { CartItem, PaymentMode } from '../../../core/types'

export interface HeldCart {
  id: string
  createdAt: string
  items: CartItem[]
  customerId: number | null
  customerName?: string
  discount: number
  paymentMode: PaymentMode
  subtotal: number
  total: number
  note?: string
}
