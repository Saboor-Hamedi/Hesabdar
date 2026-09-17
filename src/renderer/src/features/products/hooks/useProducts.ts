import { useState, useEffect, useCallback } from 'react'
import type { Product, UnitType } from '../../../core/types'
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  adjustProductStock,
  onStoreChange,
} from '../../../core/store'
import { ProductSchema, type ProductFormValues } from '../../../core/validation/schemas'
import { validateForm } from '../../../core/validation/validator'
import { notify } from '../../../core/notifications'

/**
 * Hook for managing inventory products.
 * Synchronizes in real time with the persistent core store.
 */
export function useProducts() {
  const [products, setProducts] = useState<Product[]>(() => getProducts())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductFormValues>({
    barcode: '',
    name_fa: '',
    name_ps: '',
    name_en: '',
    category_id: 1,
    unit: 'pcs',
    cost_price: 0,
    sell_price: 0,
    stock_qty: 0,
    reorder_level: 5,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Subscribe to live store updates
  useEffect(() => {
    setProducts(getProducts())
    const unsubscribe = onStoreChange(() => {
      setProducts(getProducts())
    })
    return unsubscribe
  }, [])

  // Open modal in create mode
  const openCreateModal = useCallback(() => {
    setEditingProduct(null)
    setForm({
      barcode: '',
      name_fa: '',
      name_ps: '',
      name_en: '',
      category_id: 1,
      unit: 'pcs',
      cost_price: 0,
      sell_price: 0,
      stock_qty: 0,
      reorder_level: 5,
    })
    setErrors({})
    setIsModalOpen(true)
  }, [])

  // Open modal in edit mode with existing values pre-populated
  const openEditModal = useCallback((product: Product) => {
    setEditingProduct(product)
    setForm({
      barcode: product.barcode || '',
      name_fa: product.name_fa || '',
      name_ps: product.name_ps || '',
      name_en: product.name_en || '',
      category_id: product.category_id || 1,
      unit: product.unit || 'pcs',
      cost_price: product.cost_price || 0,
      sell_price: product.sell_price || 0,
      stock_qty: product.stock_qty || 0,
      reorder_level: product.reorder_level || 5,
    })
    setErrors({})
    setIsModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setEditingProduct(null)
    setErrors({})
  }, [])

  // Submit product (handles both Create and Update)
  const submitProduct = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault()

      const result = validateForm(ProductSchema, form)
      if (!result.success) {
        setErrors(result.errors)
        return false
      }

      if (editingProduct) {
        // Update existing product
        const updated = updateProduct(editingProduct.id, {
          barcode: result.data!.barcode || null,
          name_fa: result.data!.name_fa,
          name_ps: result.data!.name_ps || null,
          name_en: result.data!.name_en || null,
          category_id: result.data!.category_id || null,
          unit: result.data!.unit as UnitType,
          cost_price: result.data!.cost_price,
          sell_price: result.data!.sell_price,
          stock_qty: result.data!.stock_qty || 0,
          reorder_level: result.data!.reorder_level || 5,
        })

        if (updated) {
          notify({
            type: 'success',
            title: 'Product Updated / جنس ویرایش شد',
            message: `${updated.name_fa} updated. Price: ${updated.sell_price} AFN, Stock: ${updated.stock_qty} ${updated.unit}.`,
          })
        }

        setIsModalOpen(false)
        setEditingProduct(null)
        setErrors({})
        return true
      }

      // Create new product
      const created = addProduct({
        barcode: result.data!.barcode || null,
        name_fa: result.data!.name_fa,
        name_ps: result.data!.name_ps || null,
        name_en: result.data!.name_en || null,
        category_id: result.data!.category_id || null,
        category_name: 'General',
        unit: result.data!.unit as UnitType,
        cost_price: result.data!.cost_price,
        sell_price: result.data!.sell_price,
        stock_qty: result.data!.stock_qty || 0,
        reorder_level: result.data!.reorder_level || 5,
      })

      notify({
        type: 'success',
        title: 'Item Created / جنس ثبت شد',
        message: `${created.name_fa} (${created.name_en || created.name_ps || ''}) — ${created.stock_qty} ${created.unit} @ ${created.sell_price} AFN`,
      })

      // Reset form for continuous item entry without closing modal
      setForm({
        barcode: '',
        name_fa: '',
        name_ps: '',
        name_en: '',
        category_id: 1,
        unit: result.data!.unit as UnitType,
        cost_price: 0,
        sell_price: 0,
        stock_qty: 0,
        reorder_level: 5,
      })
      setErrors({})

      return true
    },
    [form, editingProduct]
  )

  // Remove a product from inventory
  const removeProduct = useCallback((id: number) => {
    deleteProduct(id)
  }, [])

  // Quick adjust stock amount (+ / -)
  const adjustStock = useCallback((id: number, delta: number) => {
    adjustProductStock(id, delta)
  }, [])

  return {
    products,
    isModalOpen,
    editingProduct,
    form,
    setForm,
    errors,
    openCreateModal,
    openEditModal,
    closeModal,
    submitProduct,
    removeProduct,
    adjustStock,
  }
}
