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
      title={isEditing ? 'Edit Product Details / ویرایش جنس' : t('products.modalTitle')}
      subtitle={
        isEditing
          ? 'Modify commodity names, pricing, barcode, and inventory stock balance.'
          : t('products.modalSubtitle')
      }
      style={{ width: '900px', height: '700px', maxWidth: '95vw', maxHeight: '92vh' }}
      className="flex flex-col"
      bodyClassName="flex-1 flex flex-col p-5 overflow-y-auto"
    >
      <form onSubmit={onSubmit} className="flex flex-col justify-between h-full gap-4">
        <div className="flex flex-col gap-3.5">
          {/* Top Fast-Searchable Catalog Preset Dropdown (Shown or available in both modes) */}
          <div className="p-3.5 bg-emerald-50/40 border border-emerald-200/60 rounded-[5px]">
            <CatalogSelect
              onSelect={onSelectCatalogItem}
              selectedItemName={form.name_en || form.name_fa}
            />

            {/* Quick Popular Commodity Chips */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2.5 pt-2 border-t border-emerald-100/80">
              <span className="text-[10px] text-gray-500 font-medium">Popular Afghan Items:</span>
              {COMMON_CATALOG_ITEMS.slice(0, 8).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectCatalogItem(item)}
                  className="text-[10px] px-2.5 py-1 rounded-[5px] bg-white border border-gray-200 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 text-gray-700 transition-all shadow-2xs cursor-pointer active:scale-95 font-medium"
                >
                  {item.name_en} / {item.name_fa}
                </button>
              ))}
            </div>
          </div>

          {/* Section 1: Item Names across Languages */}
          <div className="p-3.5 border border-gray-200/90 rounded-[5px] bg-gray-50/40 flex flex-col gap-3">
            <div className="text-xs font-semibold text-gray-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                Item Names &amp; Identification
                <span className="text-[10px] font-normal text-gray-400">
                  (Auto-syncs across English, Persian, and Pashto)
                </span>
              </span>
              {isEditing && (
                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-[5px]">
                  Product ID #{editingProduct?.id}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                label="نام به دری / فارسی *"
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label={t('products.barcode')}
                placeholder="Scan or enter barcode"
                value={form.barcode || ''}
                onChange={(e) => onChangeForm((f) => ({ ...f, barcode: e.target.value }))}
                error={errors.barcode}
              />

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-gray-600">{t('products.unit')}</label>
                <select
                  value={form.unit}
                  onChange={(e) => onChangeForm((f) => ({ ...f, unit: e.target.value as UnitType }))}
                  className="w-full h-8 px-2 text-xs rounded-[5px] border border-gray-200 bg-white text-gray-800 focus:outline-none focus:border-gray-400 cursor-pointer"
                >
                  <option value="pcs">{t('products.unitPcs')}</option>
                  <option value="kg">{t('products.unitKg')}</option>
                  <option value="litre">{t('products.unitLitre')}</option>
                  <option value="pack">{t('products.unitPack')}</option>
                  <option value="box">{t('products.unitBox')}</option>
                  <option value="meter">{t('products.unitMeter')}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-gray-600">{t('products.category')}</label>
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
                  className="w-full h-8 px-2 text-xs rounded-[5px] border border-gray-200 bg-white text-gray-800 focus:outline-none focus:border-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Stock Inventory */}
          <div className="p-3.5 border border-gray-200/90 rounded-[5px] bg-gray-50/40 flex flex-col gap-3">
            <div className="text-xs font-semibold text-gray-800 flex items-center justify-between">
              <span>Pricing &amp; Stock Quantities</span>
              {form.sell_price > 0 && (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-[5px] border ${
                      form.sell_price > form.cost_price
                        ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                        : 'text-amber-800 bg-amber-50 border-amber-200'
                    }`}
                  >
                    Gain: {form.sell_price - form.cost_price} AFN ({Math.round(((form.sell_price - form.cost_price) / form.sell_price) * 100)}% margin)
                  </span>
                  {form.stock_qty > 0 && (
                    <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded-[5px]">
                      Stock Value: {(form.cost_price * form.stock_qty).toLocaleString()} AFN
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input
                label={t('products.costPrice')}
                type="number"
                placeholder="0"
                value={form.cost_price || ''}
                onChange={(e) => onChangeForm((f) => ({ ...f, cost_price: parseFloat(e.target.value) || 0 }))}
                error={errors.cost_price}
                required
              />

              <Input
                label={t('products.sellPrice')}
                type="number"
                placeholder="0"
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
                value={form.stock_qty || ''}
                onChange={(e) => onChangeForm((f) => ({ ...f, stock_qty: parseFloat(e.target.value) || 0 }))}
                error={errors.stock_qty}
              />

              <Input
                label={t('products.reorderLevel')}
                type="number"
                placeholder="5"
                value={form.reorder_level || ''}
                onChange={(e) => onChangeForm((f) => ({ ...f, reorder_level: parseFloat(e.target.value) || 0 }))}
                error={errors.reorder_level}
              />
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-100 shrink-0">
          <span className="text-[11px] text-gray-400">
            {isEditing
              ? 'Changes will be updated instantly across inventory and POS.'
              : 'Window remains open for continuous, rapid inventory entry.'}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              icon={isEditing ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
            >
              {isEditing ? 'Update Product Details' : 'Save & Add Next Item'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
