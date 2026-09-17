import React from 'react'
import { useTranslation } from 'react-i18next'
import type { UnitType } from '../../../core/types'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'

interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
  form: {
    name: string
    price: number
    amount: number
    unit: UnitType
    category: string
  }
  onChangeForm: React.Dispatch<
    React.SetStateAction<{
      name: string
      price: number
      amount: number
      unit: UnitType
      category: string
    }>
  >
  error: string
  onSubmit: (e: React.FormEvent) => void
}

/**
 * QuickAddModal: Rapid item entry modal directly from POS screen.
 */
export function QuickAddModal({
  isOpen,
  onClose,
  form,
  onChangeForm,
  error,
  onSubmit,
}: QuickAddModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Shop Item"
      subtitle="Specify item name, selling price, unit of measure, and stock amount"
      style={{ width: '560px', maxWidth: '95vw' }}
      bodyClassName="p-8"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <Input
          label="Item Name"
          placeholder="e.g. Basmati Rice, White Sugar, Tea..."
          value={form.name}
          onChange={(e) => onChangeForm((f) => ({ ...f, name: e.target.value }))}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Selling Price"
            type="number"
            placeholder="0"
            suffix="AFN"
            className="text-right font-mono font-bold"
            value={form.price || ''}
            onChange={(e) => onChangeForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
            required
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={`Amount / Stock (${form.unit})`}
            type="number"
            step="any"
            placeholder="1"
            className="text-right font-mono"
            value={form.amount}
            onChange={(e) => onChangeForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
            required
          />

          <Input
            label={t('products.category')}
            placeholder="e.g. Groceries, Dairy, Spices..."
            value={form.category}
            onChange={(e) => onChangeForm((f) => ({ ...f, category: e.target.value }))}
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex items-center justify-end gap-6 pt-4 border-t border-gray-100">
          <Button variant="ghost" type="button" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" type="submit">
            {t('common.save')} &amp; Add to Sale
          </Button>
        </div>
      </form>
    </Modal>
  )
}
