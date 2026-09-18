import React from 'react'
import { useTranslation } from 'react-i18next'
import { Package, Plus } from 'lucide-react'
import type { UnitType } from '../../../core/types'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { formatCurrency } from '../../../core/utils/formatters'

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
 * Styled consistently with DebtPaymentModal with top card profile and structured decks.
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
      title="Quick POS Item Entry"
      subtitle="Register a new store product instantly and attach it to the current transaction."
      badge={
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 shadow-2xs">
          Fast Register
        </span>
      }
      style={{ width: '640px', maxWidth: '95vw' }}
      className="flex flex-col"
      bodyClassName="flex-1 flex flex-col p-8 overflow-y-auto"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        {/* Top Profile Header Card matching DebtPaymentModal */}
        <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#5A8F7B] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900">
                {form.name || 'New Merchandise Item'}
              </span>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                <span>Unit: {form.unit}</span>
                <span>•</span>
                <span>Qty: {form.amount}</span>
              </div>
            </div>
          </div>

          <div className="text-end shrink-0">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.05em] block">
              POS Price
            </span>
            <span className="text-xl font-bold font-mono text-emerald-700 mt-0.5 block">
              {form.price > 0 ? formatCurrency(form.price) : '0 AFN'}
            </span>
          </div>
        </div>

        {/* Form Inputs in Structured Deck */}
        <div className="p-5 border border-gray-100 rounded-xl bg-gray-50/50 flex flex-col gap-4">
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
                className="w-full h-9 px-3 text-xs rounded-lg transition-all duration-150 bg-white hover:bg-gray-50 text-[#1F2937] border border-gray-200 focus:border-[#5A8F7B]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5A8F7B]/20 cursor-pointer shadow-2xs"
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
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <span className="text-[11px] text-gray-400">
            Item will be added directly into inventory &amp; the POS register.
          </span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" type="button" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" type="submit" icon={<Plus className="w-4 h-4" />}>
              {t('common.save')} &amp; Add to Sale
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
