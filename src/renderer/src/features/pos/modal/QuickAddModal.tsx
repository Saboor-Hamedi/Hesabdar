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
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Input
          label="Item Name *"
          placeholder="e.g. Basmati Rice, White Sugar, Tea..."
          value={form.name}
          onChange={(e) => onChangeForm((f) => ({ ...f, name: e.target.value }))}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Selling Price (AFN) *"
            type="number"
            placeholder="0"
            value={form.price || ''}
            onChange={(e) => onChangeForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-gray-600">{t('products.unit')}</label>
            <select
              value={form.unit}
              onChange={(e) => onChangeForm((f) => ({ ...f, unit: e.target.value as UnitType }))}
              className="w-full h-8 px-2 text-xs rounded-[5px] border border-gray-200 bg-white text-gray-800 focus:outline-none focus:border-gray-400"
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

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={`Amount / Stock (${form.unit}) *`}
            type="number"
            step="any"
            placeholder="1"
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

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <Button variant="outline" type="button" onClick={onClose}>
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
