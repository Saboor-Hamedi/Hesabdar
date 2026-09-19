import React from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Check, BookOpen, Package } from 'lucide-react'
import type { ProductFormValues } from '../../../core/validation/schemas'
import type { Product, UnitType } from '../../../core/types'
import { initAndGetCatalog, type CatalogItem } from '../../../core/products/catalogData'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  form: ProductFormValues
  errors: Record<string, string>
  editingProduct?: Product | null
  onChangeForm: React.Dispatch<React.SetStateAction<ProductFormValues>>
  onSubmit: (e: React.FormEvent) => void
  onOpenCatalog?: () => void
}

/**
 * ProductModal: Executive trilingual product entry & editing modal (920px x 700px).
 * Styled consistently with DebtPaymentModal with top card profile and structured decks.
 */
export function ProductModal({
  isOpen,
  onClose,
  form,
  errors,
  editingProduct,
  onChangeForm,
  onSubmit,
  onOpenCatalog,
}: ProductModalProps) {
  const { t } = useTranslation()
  const isEditing = Boolean(editingProduct)
  const [catalogItems, setCatalogItems] = React.useState<CatalogItem[]>([])

  // Load catalog commodities from SQLite on modal open
  React.useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    initAndGetCatalog().then((items) => {
      if (!cancelled) setCatalogItems(items)
    })
    return () => {
      cancelled = true
    }
  }, [isOpen])

  // Smart English name search: auto-fills Persian & Pashto if matched, but clearing English NEVER wipes them out
  const handleEnglishNameChange = (val: string) => {
    onChangeForm((prev) => {
      const next = { ...prev, name_en: val }
      const q = val.trim().toLowerCase()

      // When user types at least 3 characters in English (e.g. "wheat", "rice", "oil", "sugar", "tea")
      if (q.length >= 3 && catalogItems.length > 0) {
        const match = catalogItems.find((it) => {
          const en = it.name_en.toLowerCase()
          return (
            en === q ||
            en.startsWith(q) ||
            en.split(/[\s\-\(\)\/]+/).some((w) => w.length >= 3 && (w.startsWith(q) || q.startsWith(w)))
          )
        })

        if (match) {
          next.name_fa = match.name_fa
          next.name_ps = match.name_ps
          if (!next.barcode) next.barcode = match.barcode
          if (!next.unit || next.unit === 'pcs') next.unit = match.unit
          if (!next.cost_price || next.cost_price === 0) next.cost_price = match.suggested_cost
          if (!next.sell_price || next.sell_price === 0) next.sell_price = match.suggested_price
          if (!next.stock_qty || next.stock_qty === 0) next.stock_qty = match.default_stock
        }
      }
      // If cleared or shorter than 3 chars, do not alter name_fa or name_ps so users can freely re-write
      return next
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Product Details' : 'Add New Inventory Item'}
      subtitle={
        isEditing
          ? 'Modify commodity names, pricing, barcode, and inventory stock balance.'
          : 'Register new merchandise item into POS and inventory database.'
      }
      badge={
        isEditing ? (
          <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs">
            Product #{editingProduct?.id}
          </span>
        ) : (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs">
            Inventory Master
          </span>
        )
      }
      style={{ width: '920px', maxWidth: '95vw', height: '688px', maxHeight: '92vh' }}
      className="flex flex-col"
      bodyClassName="flex-1 flex flex-col p-8 overflow-y-auto"
    >
      <form onSubmit={onSubmit} className="flex flex-col justify-between h-full gap-6">
        <div className="flex flex-col gap-5">
          {/* Top Profile Header Card matching DebtPaymentModal */}
          <div className="p-4 bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#5A8F7B] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900 dark:text-slate-100">
                  {form.name_fa || form.name_en || (isEditing ? 'Product Master Record' : 'New Merchandise Entry')}
                </span>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                  <span className="font-mono">{form.barcode ? `Barcode: ${form.barcode}` : 'No Barcode Assigned'}</span>
                  <span>•</span>
                  <span>Unit: {form.unit}</span>
                </div>
              </div>
            </div>

            <div className="text-end shrink-0">
              <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-[0.05em] block">
                {form.sell_price > 0 ? 'Selling Price' : 'Inventory Price'}
              </span>
              <span
                className={`text-xl font-bold font-mono mt-0.5 block ${
                  form.sell_price > form.cost_price
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : form.sell_price > 0
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-gray-600 dark:text-slate-400'
                }`}
              >
                {form.sell_price > 0 ? `${form.sell_price.toLocaleString()} AFN` : '0 AFN'}
              </span>
            </div>
          </div>

          {!isEditing && onOpenCatalog && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-emerald-950 dark:text-emerald-300 font-medium">
                <BookOpen className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>Standard Afghan commodities available with names, units &amp; barcodes.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenCatalog()
                }}
                className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-200 underline underline-offset-2 cursor-pointer transition-colors"
              >
                Browse Catalog Table &rarr;
              </button>
            </div>
          )}

          {/* Section 1: Item Names across Languages in Structured Deck */}
          <div className="p-5 border border-gray-100 dark:border-slate-800 rounded-xl bg-gray-50/50 dark:bg-slate-800/40 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* English Name */}
              <Input
                label="Name in English"
                placeholder="e.g. Cooking Oil, Rice, Sugar..."
                value={form.name_en || ''}
                onChange={(e) => handleEnglishNameChange(e.target.value)}
                error={errors.name_en}
              />

              {/* Persian / Dari Name */}
              <Input
                label="نام به دری / فارسی"
                placeholder="مثلاً: روغن نباتی، برنج..."
                value={form.name_fa}
                onChange={(e) => onChangeForm((f) => ({ ...f, name_fa: e.target.value }))}
                error={errors.name_fa}
                required
              />

              {/* Pashto Name */}
              <Input
                label="نوم په پښتو"
                placeholder="مثلاً: نباتي غوړي، وریژې..."
                value={form.name_ps || ''}
                onChange={(e) => onChangeForm((f) => ({ ...f, name_ps: e.target.value }))}
                error={errors.name_ps}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label={t('products.barcode')}
                placeholder="Scan or enter barcode"
                value={form.barcode || ''}
                onChange={(e) => onChangeForm((f) => ({ ...f, barcode: e.target.value }))}
                error={errors.barcode}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B7280] dark:text-slate-400 select-none">
                  {t('products.unit')}
                </label>
                <select
                  value={form.unit}
                  onChange={(e) => onChangeForm((f) => ({ ...f, unit: e.target.value as UnitType }))}
                  className="w-full h-9 px-3 text-xs rounded-lg transition-all duration-150 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-[#1F2937] dark:text-slate-100 border border-gray-200 dark:border-slate-700 focus:border-[#5A8F7B]/40 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5A8F7B]/20 cursor-pointer shadow-2xs"
                >
                  <option value="pcs">{t('products.unitPcs')}</option>
                  <option value="kg">{t('products.unitKg')}</option>
                  <option value="litre">{t('products.unitLitre')}</option>
                  <option value="pack">{t('products.unitPack')}</option>
                  <option value="box">{t('products.unitBox')}</option>
                  <option value="meter">{t('products.unitMeter')}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B7280] dark:text-slate-400 select-none">
                  {t('products.category')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Groceries, Dairy, Spices..."
                  value={form.category_id ? String(form.category_id) : ''}
                  onChange={(e) =>
                    onChangeForm((f) => ({
                      ...f,
                      category_id: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  className="w-full h-9 px-3 text-xs rounded-lg transition-all duration-150 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-[#1F2937] dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 border border-gray-200 dark:border-slate-700 focus:border-[#5A8F7B]/40 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5A8F7B]/20 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Stock Inventory in Structured Deck */}
          <div className="p-5 border border-gray-100 dark:border-slate-800 rounded-xl bg-gray-50/50 dark:bg-slate-800/40 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 dark:text-slate-200 uppercase tracking-[0.05em]">
                Pricing &amp; Stock Quantities
              </span>
              {form.sell_price > 0 && (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full border ${
                      form.sell_price > form.cost_price
                        ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/70 dark:border-emerald-800/60'
                        : 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200/70 dark:border-amber-800/60'
                    }`}
                  >
                    Gain: {form.sell_price - form.cost_price} AFN ({Math.round(((form.sell_price - form.cost_price) / form.sell_price) * 100)}% margin)
                  </span>
                  {form.stock_qty > 0 && (
                    <span className="text-xs font-mono text-gray-500 dark:text-slate-300 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-gray-200 dark:border-slate-700">
                      Stock Value: {(form.cost_price * form.stock_qty).toLocaleString()} AFN
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Input
                label={t('products.costPrice')}
                type="number"
                placeholder="0"
                suffix="AFN"
                className="text-right font-mono"
                value={form.cost_price || ''}
                onChange={(e) => onChangeForm((f) => ({ ...f, cost_price: parseFloat(e.target.value) || 0 }))}
                error={errors.cost_price}
                required
              />

              <Input
                label={t('products.sellPrice')}
                type="number"
                placeholder="0"
                suffix="AFN"
                className="text-right font-mono"
                value={form.sell_price || ''}
                onChange={(e) => onChangeForm((f) => ({ ...f, sell_price: parseFloat(e.target.value) || 0 }))}
                error={errors.sell_price}
                required
              />

              <Input
                label={t('products.stockQty')}
                type="number"
                step="any"
                placeholder="0"
                className="text-right font-mono"
                value={form.stock_qty || ''}
                onChange={(e) => onChangeForm((f) => ({ ...f, stock_qty: parseFloat(e.target.value) || 0 }))}
                error={errors.stock_qty}
              />

              <Input
                label={t('products.reorderLevel')}
                type="number"
                placeholder="5"
                className="text-right font-mono"
                value={form.reorder_level || ''}
                onChange={(e) => onChangeForm((f) => ({ ...f, reorder_level: parseFloat(e.target.value) || 0 }))}
                error={errors.reorder_level}
              />
            </div>
          </div>
        </div>

        {/* Modal Actions matching DebtPaymentModal */}
        <div className="flex items-center justify-between pt-5 border-t border-gray-100 dark:border-slate-800 shrink-0">
          <span className="text-[11px] text-gray-400 dark:text-slate-400">
            {isEditing
              ? 'Changes will be updated instantly across inventory and POS.'
              : 'Window remains open for continuous, rapid inventory entry.'}
          </span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              icon={isEditing ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            >
              {isEditing ? 'Update Product Details' : 'Save & Add Next Item'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
