import React from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Check } from 'lucide-react'
import type { ProductFormValues } from '../../../core/validation/schemas'
import type { Product, UnitType } from '../../../core/types'
import { COMMON_CATALOG_ITEMS, type CatalogItem } from '../../../core/products/catalogData'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { CatalogSelect } from '../catalog/CatalogSelect'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  form: ProductFormValues
  errors: Record<string, string>
  editingProduct?: Product | null
  onSelectCatalogItem: (item: CatalogItem) => void
  onEnglishNameChange: (val: string) => void
  onPersianNameChange: (val: string) => void
  onChangeForm: React.Dispatch<React.SetStateAction<ProductFormValues>>
  onSubmit: (e: React.FormEvent) => void
}

/**
 * ProductModal: Spacious, trilingual product entry & editing modal (900px x 700px).
 */
export function ProductModal({
  isOpen,
  onClose,
  form,
  errors,
  editingProduct,
  onSelectCatalogItem,
  onEnglishNameChange,
  onPersianNameChange,
  onChangeForm,
  onSubmit,
}: ProductModalProps) {
  const { t } = useTranslation()
  const isEditing = Boolean(editingProduct)

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
          <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 shadow-2xs">
            Product #{editingProduct?.id}
          </span>
        ) : undefined
      }
      style={{ width: '920px', maxWidth: '95vw', maxHeight: '92vh' }}
      className="flex flex-col"
      bodyClassName="flex-1 flex flex-col p-8 overflow-y-auto"
    >
      <form onSubmit={onSubmit} className="flex flex-col justify-between h-full gap-6">
        <div className="flex flex-col gap-5">
          {/* Top Fast-Searchable Catalog Preset Dropdown */}
          <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
            <CatalogSelect
              onSelect={onSelectCatalogItem}
              selectedItemName={form.name_en || form.name_fa}
            />

            {/* Quick Popular Commodity Chips */}
            <div className="flex items-center gap-2 flex-wrap mt-3 pt-2.5 border-t border-gray-200/60">
              <span className="text-[11px] text-gray-500 font-medium">Popular Afghan Items:</span>
              {COMMON_CATALOG_ITEMS.slice(0, 8).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectCatalogItem(item)}
                  className="text-xs px-3 py-1 rounded-full bg-white border border-gray-200/80 hover:bg-[#5A8F7B] hover:text-white hover:border-[#5A8F7B] text-gray-700 transition-all shadow-2xs cursor-pointer active:scale-95 font-medium"
                >
                  {item.name_en} / {item.name_fa}
                </button>
              ))}
            </div>
          </div>

          {/* Section 1: Item Names across Languages */}
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* English Name with Auto-Suggest */}
              <Input
                label="Name in English"
                placeholder="e.g. Cooking Oil, Rice, Sugar..."
                value={form.name_en || ''}
                onChange={(e) => onEnglishNameChange(e.target.value)}
                error={errors.name_en}
              />

              {/* Persian / Dari Name */}
              <Input
                label="نام به دری / فارسی"
                placeholder="مثلاً: روغن نباتی، برنج..."
                value={form.name_fa}
                onChange={(e) => onPersianNameChange(e.target.value)}
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
                <label className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B7280] select-none">
                  {t('products.unit')}
                </label>
                <select
                  value={form.unit}
                  onChange={(e) => onChangeForm((f) => ({ ...f, unit: e.target.value as UnitType }))}
                  className="w-full h-9 px-3 text-xs rounded-lg transition-all duration-150 bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#1F2937] border border-transparent focus:border-[#5A8F7B]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5A8F7B]/20 cursor-pointer"
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
                <label className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B7280] select-none">
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
                  className="w-full h-9 px-3 text-xs rounded-lg transition-all duration-150 bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#1F2937] placeholder:text-gray-400 border border-transparent focus:border-[#5A8F7B]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5A8F7B]/20"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Stock Inventory */}
          <div className="pt-4 border-t border-gray-100 flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B7280]">
                Pricing &amp; Stock Quantities
              </span>
              {form.sell_price > 0 && (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full border ${
                      form.sell_price > form.cost_price
                        ? 'text-emerald-800 bg-emerald-50 border-emerald-200/70'
                        : 'text-amber-800 bg-amber-50 border-amber-200/70'
                    }`}
                  >
                    Gain: {form.sell_price - form.cost_price} AFN ({Math.round(((form.sell_price - form.cost_price) / form.sell_price) * 100)}% margin)
                  </span>
                  {form.stock_qty > 0 && (
                    <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
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

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-5 border-t border-gray-100 shrink-0">
          <span className="text-[11px] text-gray-400">
            {isEditing
              ? 'Changes will be updated instantly across inventory and POS.'
              : 'Window remains open for continuous, rapid inventory entry.'}
          </span>
          <div className="flex items-center gap-6">
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
