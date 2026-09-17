import { useState, useEffect, useMemo, useCallback } from 'react'
import type { Product, Customer, CartItem, PaymentMode, UnitType, Sale } from '../../../core/types'
import {
  getProducts,
  getCustomers,
  recordSale as addSale,
  addProduct as storeAddProduct,
  addCustomer as storeAddCustomer,
  onStoreChange,
} from '../../../core/store'
import { notify } from '../../../core/notifications'

export type ActiveField = 'amount' | 'price' | 'discount' | 'paid'

export function usePOS() {
  const [products, setProducts] = useState<Product[]>(() => getProducts())
  const [customers, setCustomers] = useState<Customer[]>(() => getCustomers())
  const [cart, setCart] = useState<CartItem[]>([])

  // Financial inputs
  const [discount, setDiscount] = useState<number>(0)
  const [cashPaid, setCashPaid] = useState<number>(0)
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash')

  // Fast Cashier Input draft item state
  const [entryProduct, setEntryProduct] = useState<Product | null>(null)
  const [entrySearchQuery, setEntrySearchQuery] = useState<string>('')
  const [entryAmount, setEntryAmount] = useState<number>(1)
  const [entryPrice, setEntryPrice] = useState<number>(0)
  const [entryUnit, setEntryUnit] = useState<UnitType>('pcs')

  // Calculator active target field
  const [activeField, setActiveField] = useState<ActiveField>('amount')

  useEffect(() => {
    setProducts(getProducts())
    setCustomers(getCustomers())
    const unsubscribe = onStoreChange(() => {
      setProducts(getProducts())
      setCustomers(getCustomers())
    })
    return unsubscribe
  }, [])

  // Cart Calculations
  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + (item.line_total || 0), 0),
    [cart]
  )

  const total = useMemo(() => Math.max(0, subtotal - discount), [subtotal, discount])

  // Update product selection in draft entry
  const handleSelectProduct = useCallback((product: Product | null) => {
    setEntryProduct(product)
    if (product) {
      setEntrySearchQuery(product.name_fa || product.name_en || '')
      setEntryPrice(product.sell_price)
      setEntryUnit(product.unit || 'pcs')
      setEntryAmount(1)
      setActiveField('amount')
    } else {
      setEntrySearchQuery('')
      setEntryPrice(0)
      setEntryAmount(1)
    }
  }, [])

  // Add Item to Invoice Table from ItemEntryBar
  const handleAddEntryItem = useCallback(() => {
    if (!entryProduct) {
      notify({
        type: 'warning',
        title: 'No Product Selected',
        message: 'Please choose or scan a product first.',
      })
      return
    }

    if (entryAmount <= 0) {
      notify({
        type: 'warning',
        title: 'Invalid Amount',
        message: 'Amount must be greater than zero.',
      })
      return
    }

    const currentProduct = entryProduct
    const qtyToAdd = entryAmount
    const priceToCharge = entryPrice
    const unitToUse = entryUnit

    setCart((prev) => {
      const existing = prev.find((it) => it.product_id === currentProduct.id)
      if (existing) {
        const nextQty = Math.round((existing.qty + qtyToAdd) * 100) / 100
        return prev.map((it) =>
          it.product_id === currentProduct.id
            ? {
                ...it,
                qty: nextQty,
                unit_price: priceToCharge,
                unit: unitToUse,
                line_total: Math.round(nextQty * priceToCharge * 100) / 100,
              }
            : it
        )
      }

      const newItem: CartItem = {
        product_id: currentProduct.id,
        product_name: currentProduct.name_fa || currentProduct.name_en || 'Commodity',
        unit: unitToUse,
        qty: qtyToAdd,
        unit_price: priceToCharge,
        cost_price: currentProduct.cost_price,
        line_total: Math.round(qtyToAdd * priceToCharge * 100) / 100,
      }
      return [newItem, ...prev]
    })

    // Reset draft entry to allow fast subsequent scans/inputs
    setEntryProduct(null)
    setEntrySearchQuery('')
    setEntryAmount(1)
    setEntryPrice(0)
    setActiveField('amount')
  }, [entryProduct, entryAmount, entryPrice, entryUnit])

  // Direct Add Product to Cart (from click or scan)
  const addToCart = useCallback((product: Product) => {
    if (product.stock_qty <= 0) {
      notify({
        type: 'warning',
        title: 'Out of Stock',
        message: `${product.name_fa || product.name_en} has zero stock remaining.`,
      })
    }

    setCart((prev) => {
      const existing = prev.find((it) => it.product_id === product.id)
      if (existing) {
        const nextQty = existing.qty + 1
        return prev.map((it) =>
          it.product_id === product.id
            ? { ...it, qty: nextQty, line_total: Math.round(nextQty * it.unit_price * 100) / 100 }
            : it
        )
      }

      const newItem: CartItem = {
        product_id: product.id,
        product_name: product.name_fa || product.name_en || 'Commodity',
        unit: product.unit || 'pcs',
        qty: 1,
        unit_price: product.sell_price,
        cost_price: product.cost_price,
        line_total: product.sell_price,
      }
      return [newItem, ...prev]
    })
  }, [])

  // Update Qty with step (+1, -1)
  const updateQty = useCallback((productId: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((it) => {
          if (it.product_id === productId) {
            const nextQty = Math.max(0.01, it.qty + delta)
            return {
              ...it,
              qty: Math.round(nextQty * 100) / 100,
              line_total: Math.round(nextQty * it.unit_price * 100) / 100,
            }
          }
          return it
        })
        .filter((it) => it.qty > 0)
    })
  }, [])

  // Set explicit Qty directly
  const setItemQty = useCallback((productId: number, qty: number) => {
    setCart((prev) => {
      if (qty <= 0) {
        return prev.filter((it) => it.product_id !== productId)
      }
      return prev.map((it) => {
        if (it.product_id === productId) {
          return {
            ...it,
            qty,
            line_total: Math.round(qty * it.unit_price * 100) / 100,
          }
        }
        return it
      })
    })
  }, [])

  // Remove Item
  const removeItem = useCallback((productId: number) => {
    setCart((prev) => prev.filter((it) => it.product_id !== productId))
  }, [])

  // Clear Cart & Invoice
  const clearCart = useCallback(() => {
    setCart([])
    setDiscount(0)
    setCashPaid(0)
    setSelectedCustomerId(null)
    setPaymentMode('cash')
    setEntryProduct(null)
    setEntrySearchQuery('')
    setEntryAmount(1)
    setEntryPrice(0)
    setActiveField('amount')
  }, [])

  // Calculator Keystroke Routing
  const handleCalculatorKeyPress = useCallback(
    (key: string) => {
      const getVal = () => {
        switch (activeField) {
          case 'amount':
            return entryAmount
          case 'price':
            return entryPrice
          case 'discount':
            return discount
          case 'paid':
            return cashPaid
        }
      }

      const setVal = (newVal: number) => {
        switch (activeField) {
          case 'amount':
            setEntryAmount(newVal)
            break
          case 'price':
            setEntryPrice(newVal)
            break
          case 'discount':
            setDiscount(newVal)
            break
          case 'paid':
            setCashPaid(newVal)
            break
        }
      }

      if (key === 'clear') {
        setVal(activeField === 'amount' ? 1 : 0)
        return
      }

      if (key === 'enter') {
        if (activeField === 'amount' || activeField === 'price') {
          handleAddEntryItem()
        }
        return
      }

      if (key === 'backspace') {
        const curStr = String(getVal())
        if (curStr.length <= 1) {
          setVal(activeField === 'amount' ? 1 : 0)
        } else {
          const nextStr = curStr.slice(0, -1)
          setVal(parseFloat(nextStr) || 0)
        }
        return
      }

      // Numbers or decimal
      const curStr = String(getVal())
      if (curStr.length >= 12) return // Prevent overflow
      if (curStr === '0' && (key === '0' || key === '00')) return // Prevent infinite zeros

      let nextStr = ''
      if (curStr === '0' && key !== '.') {
        nextStr = key === '00' ? '0' : key
      } else if (key === '.' && curStr.includes('.')) {
        return // already has decimal point
      } else {
        nextStr = curStr + key
      }

      const parsed = parseFloat(nextStr)
      if (!isNaN(parsed)) {
        setVal(parsed)
      }
    },
    [activeField, entryAmount, entryPrice, discount, cashPaid, handleAddEntryItem]
  )

  // Quick Amount addition (+1, +5, +10)
  const handleQuickAmountAdd = useCallback(
    (delta: number) => {
      setActiveField('amount')
      setEntryAmount((prev) => Math.max(0.01, Math.round((prev + delta) * 100) / 100))
    },
    []
  )

  // Quick Banknote set for cash paid
  const handleQuickCashSet = useCallback((amount: number) => {
    setActiveField('paid')
    setCashPaid(amount)
  }, [])

  // Process Checkout & Save Sale
  const processCheckout = useCallback((): Sale | null => {
    if (cart.length === 0) return null

    try {
      const isCredit = paymentMode === 'credit'
      const actualPaid = isCredit ? 0 : Math.min(cashPaid || total, total)
      const actualDue = isCredit ? total : Math.max(0, total - (cashPaid || total))

      const sale = addSale({
        customer_id: selectedCustomerId,
        subtotal,
        discount,
        total,
        paid: actualPaid,
        due: actualDue,
        payment_mode: paymentMode,
        items: cart,
      })

      notify({
        type: 'success',
        title: 'Invoice Recorded',
        message: `Sale ${sale.invoice_no} completed. Stock quantities adjusted.`,
      })
      return sale
    } catch (err) {
      console.error('Checkout error:', err)
      notify({
        type: 'error',
        title: 'Checkout Error',
        message: 'Could not record transaction.',
      })
      return null
    }
  }, [cart, selectedCustomerId, subtotal, discount, total, cashPaid, paymentMode])

  // Direct product addition from POS
  const addProductDirectly = useCallback(
    (input: {
      name_fa: string
      sell_price: number
      stock_qty: number
      unit: UnitType
      category_name?: string
      cost_price?: number
    }) => {
      return storeAddProduct({
        name_fa: input.name_fa,
        sell_price: input.sell_price,
        stock_qty: input.stock_qty,
        unit: input.unit,
        category_name: input.category_name,
        cost_price: input.cost_price || 0,
      })
    },
    []
  )

  // Direct customer addition
  const addCustomer = useCallback(
    (input: { name: string; phone?: string | null; address?: string | null }) => {
      return storeAddCustomer({
        name: input.name,
        phone: input.phone || null,
        address: input.address || null,
        balance: 0,
      })
    },
    []
  )

  // Active current value for calculator display
  const currentActiveValue = useMemo(() => {
    switch (activeField) {
      case 'amount':
        return entryAmount
      case 'price':
        return entryPrice
      case 'discount':
        return discount
      case 'paid':
        return cashPaid
    }
  }, [activeField, entryAmount, entryPrice, discount, cashPaid])

  return {
    products,
    customers,
    cart,
    subtotal,
    discount,
    setDiscount,
    total,
    cashPaid,
    setCashPaid,
    selectedCustomerId,
    setSelectedCustomerId,
    paymentMode,
    setPaymentMode,
    // Draft entry state
    entryProduct,
    entrySearchQuery,
    entryAmount,
    entryPrice,
    entryUnit,
    setEntryAmount,
    setEntryPrice,
    setEntryUnit,
    setEntrySearchQuery,
    handleSelectProduct,
    handleAddEntryItem,
    // Numpad interaction
    activeField,
    setActiveField,
    currentActiveValue,
    handleCalculatorKeyPress,
    handleQuickAmountAdd,
    handleQuickCashSet,
    // Cart actions
    addToCart,
    updateQty,
    setItemQty,
    removeItem,
    clearCart,
    processCheckout,
    addProductDirectly,
    addCustomer,
  }
}
