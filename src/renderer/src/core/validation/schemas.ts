import { z } from 'zod'

/**
 * Afghan & International phone regex:
 * - Afghan mobile: 07XXXXXXXX (exactly 10 digits)
 * - Afghan mobile without 0: 7XXXXXXXX (exactly 9 digits)
 * - Afghan mobile with +93: +937XXXXXXXX
 * - Afghan mobile with 0093: 00937XXXXXXXX
 * - Afghan landline: 020XXXXXXX / +9320XXXXXXX
 * - International format with +: +[1-9][0-9]{7,14} (8 to 15 digits)
 */
export const afghanPhoneRegex =
  /^(?:(?:\+93|0093|0)?7[0-9]{8}|(?:\+93|0)?20[0-9]{6,7}|\+[1-9][0-9]{7,14})$/

/**
 * Barcode regex: supports standard alphanumeric barcodes 4-32 characters
 */
export const barcodeRegex = /^[A-Za-z0-9\-_]{4,32}$/

/**
 * Validation schema for Inventory Products
 */
export const ProductSchema = z
  .object({
    barcode: z
      .string()
      .trim()
      .regex(barcodeRegex, 'Barcode must be 4-32 alphanumeric characters')
      .optional()
      .or(z.literal(''))
      .nullable(),
    name_fa: z
      .string()
      .trim()
      .min(2, 'Persian/Dari name must be at least 2 characters')
      .max(120, 'Name cannot exceed 120 characters'),
    name_ps: z
      .string()
      .trim()
      .max(120, 'Pashto name cannot exceed 120 characters')
      .optional()
      .or(z.literal(''))
      .nullable(),
    name_en: z
      .string()
      .trim()
      .max(120, 'English name cannot exceed 120 characters')
      .optional()
      .or(z.literal(''))
      .nullable(),
    category_id: z.coerce.number().int().positive().nullable().optional(),
    unit: z.enum(['kg', 'pcs', 'litre', 'pack', 'box', 'meter']),
    cost_price: z.coerce
      .number()
      .min(0, 'Cost price cannot be negative'),
    sell_price: z.coerce
      .number()
      .min(0.01, 'Selling price must be greater than 0'),
    stock_qty: z.coerce
      .number()
      .min(0, 'Stock quantity cannot be negative')
      .default(0),
    reorder_level: z.coerce
      .number()
      .min(0, 'Reorder level cannot be negative')
      .default(5),
  })
  .refine((data) => data.sell_price >= data.cost_price, {
    message: 'Selling price must be greater than or equal to cost price',
    path: ['sell_price'],
  })

export type ProductFormValues = z.infer<typeof ProductSchema>

/**
 * Validation schema for Customers
 */
export const CustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Customer name must be at least 2 characters')
    .max(80, 'Name cannot exceed 80 characters'),
  phone: z
    .string()
    .trim()
    .regex(afghanPhoneRegex, 'Invalid phone number (Afghan mobile must be 10 digits, e.g. 07XXXXXXXX or +937XXXXXXXX)')
    .optional()
    .or(z.literal(''))
    .nullable(),
  address: z.string().trim().max(200, 'Address is too long').optional().or(z.literal('')).nullable(),
  balance: z.coerce.number().default(0),
})

export type CustomerFormValues = z.infer<typeof CustomerSchema>

/**
 * Validation schema for Suppliers
 */
export const SupplierSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Supplier name must be at least 2 characters')
    .max(80, 'Supplier name cannot exceed 80 characters'),
  company: z.string().trim().max(100, 'Company name too long').optional().or(z.literal('')).nullable(),
  phone: z
    .string()
    .trim()
    .regex(afghanPhoneRegex, 'Invalid phone number (Afghan mobile must be 10 digits, e.g. 07XXXXXXXX or +937XXXXXXXX)')
    .optional()
    .or(z.literal(''))
    .nullable(),
  balance: z.coerce.number().default(0),
})

export type SupplierFormValues = z.infer<typeof SupplierSchema>

/**
 * Validation schema for Cart line items
 */
export const SaleItemSchema = z.object({
  product_id: z.coerce.number().int().positive('Invalid product'),
  qty: z.coerce.number().positive('Quantity must be greater than 0'),
  unit_price: z.coerce.number().min(0, 'Unit price cannot be negative'),
  cost_price: z.coerce.number().min(0, 'Cost price cannot be negative'),
})

/**
 * Validation schema for Point of Sale Checkout
 */
export const CheckoutSchema = z
  .object({
    customer_id: z.coerce.number().int().positive().nullable().optional(),
    subtotal: z.coerce.number().min(0),
    discount: z.coerce.number().min(0, 'Discount cannot be negative').default(0),
    total: z.coerce.number().min(0),
    paid: z.coerce.number().min(0, 'Paid amount cannot be negative'),
    payment_mode: z.enum(['cash', 'card', 'credit', 'bank']),
  })
  .refine((data) => data.discount <= data.subtotal, {
    message: 'Discount cannot exceed subtotal',
    path: ['discount'],
  })

export type CheckoutFormValues = z.infer<typeof CheckoutSchema>

/**
 * Validation schema for System Settings
 */
export const SettingsSchema = z.object({
  storeName: z.string().trim().min(2, 'Store name must be at least 2 characters').max(60),
  phone: z
    .string()
    .trim()
    .regex(afghanPhoneRegex, 'Invalid phone format')
    .optional()
    .or(z.literal('')),
  currency: z.string().trim().min(1, 'Currency symbol required').max(10),
  address: z.string().trim().max(150, 'Address too long').optional().or(z.literal('')),
  taxRate: z.coerce.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax cannot exceed 100%'),
  language: z.enum(['en', 'fa', 'ps']),
})

export type SettingsFormValues = z.infer<typeof SettingsSchema>
