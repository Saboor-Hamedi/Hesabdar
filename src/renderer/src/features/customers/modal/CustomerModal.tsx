import React from 'react'
import { Plus, Check, User, Wallet } from 'lucide-react'
import type { CustomerFormValues } from '../../../core/validation/schemas'
import type { Customer } from '../../../core/types'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { formatCurrency } from '../../../core/utils/formatters'

interface CustomerModalProps {
  isOpen: boolean
  onClose: () => void
  form: CustomerFormValues
  errors: Record<string, string>
  editingCustomer?: Customer | null
  onChangeForm: React.Dispatch<React.SetStateAction<CustomerFormValues>>
  onSubmit: (e: React.FormEvent) => void
}

/**
 * CustomerModal: Executive customer profile & debt account modal (920px x 700px).
 * Styled consistently with DebtPaymentModal with top debtor profile card and structured decks.
 */
export function CustomerModal({
  isOpen,
  onClose,
  form,
  errors,
  editingCustomer,
  onChangeForm,
  onSubmit,
}: CustomerModalProps) {
  const isEditing = Boolean(editingCustomer)

  const currentDebt = form.balance || 0
  const initials = form.name.trim() ? form.name.trim().slice(0, 2).toUpperCase() : 'CU'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Customer Account Profile #${editingCustomer?.id}` : 'Customer Account Registry'}
      subtitle={
        isEditing
          ? 'Modifications reflect automatically across POS checkout and customer ledger.'
          : 'Register customer contact profile, credit allowances, and opening ledger balance.'
      }
      badge={
        <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 shadow-2xs">
          {isEditing ? `CUST-${String(1000 + (editingCustomer?.id || 1))}` : 'Accounts Receivable'}
        </span>
      }
      style={{ width: '920px', maxWidth: '95vw', maxHeight: '92vh' }}
      className="flex flex-col"
      bodyClassName="flex-1 flex flex-col p-8 overflow-y-auto"
    >
      <form onSubmit={onSubmit} className="flex flex-col justify-between h-full gap-6">
        <div className="flex flex-col gap-5">
          {/* Top Debtor Profile Header Card matching DebtPaymentModal */}
          <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#5A8F7B] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                {initials}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900">
                  {form.name || 'New Customer Account'}
                </span>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                  <span className="font-mono">{form.phone || 'No phone entered'}</span>
                  {form.address && <span>• {form.address}</span>}
                </div>
              </div>
            </div>

            <div className="text-end shrink-0">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.05em] block">
                {isEditing ? 'Outstanding Debt' : 'Initial Credit / Debt'}
              </span>
              <span
                className={`text-xl font-bold font-mono mt-0.5 block ${
                  currentDebt > 0
                    ? 'text-amber-700'
                    : currentDebt < 0
                      ? 'text-emerald-700'
                      : 'text-gray-600'
                }`}
              >
                {currentDebt !== 0 ? formatCurrency(currentDebt) : '0 AFN (Clean Balance)'}
              </span>
            </div>
          </div>

          {/* Section 1: Customer Profile & Contact Details in Structured Deck */}
          <div className="p-5 border border-gray-100 rounded-xl bg-gray-50/50 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-[0.05em] flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#5A8F7B]" />
                Contact Profile &amp; Location
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="e.g. Ahmad Shah, Mohammad Gul"
                value={form.name}
                onChange={(e) => onChangeForm((f) => ({ ...f, name: e.target.value }))}
                error={errors.name}
                required
              />

              <Input
                label="Primary Phone Number"
                placeholder="0799123456 or 0701234567"
                value={form.phone || ''}
                onChange={(e) => onChangeForm((f) => ({ ...f, phone: e.target.value }))}
                error={errors.phone}
              />
            </div>

            <div className="grid grid-cols-1">
              <Input
                label="Address / Location / Shop Details"
                placeholder="e.g. Karte 4, Kabul / Shop #12 Market Plaza"
                value={form.address || ''}
                onChange={(e) => onChangeForm((f) => ({ ...f, address: e.target.value }))}
                error={errors.address}
              />
            </div>
          </div>

          {/* Section 2: Financial Ledger & Opening Debt in Structured Deck */}
          <div className="p-5 border border-gray-100 rounded-xl bg-gray-50/50 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-[0.05em] flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-[#5A8F7B]" />
                {isEditing ? 'Current Debt Balance' : 'Opening Debt Balance'}
              </span>
              {currentDebt > 0 && (
                <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200/70 px-2.5 py-0.5 rounded-full">
                  Balance Due: {formatCurrency(currentDebt)}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Input
                label={isEditing ? 'Outstanding Balance (AFN)' : 'Initial Balance (AFN)'}
                type="number"
                placeholder="0"
                suffix="AFN"
                className="text-right font-mono text-base font-bold"
                value={form.balance || ''}
                onChange={(e) => onChangeForm((f) => ({ ...f, balance: parseFloat(e.target.value) || 0 }))}
                error={errors.balance}
              />

              {/* Quick Banknote Settlement Presets / Chips */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[11px] text-gray-500 font-medium">Quick Amounts:</span>
                {[0, 1000, 2000, 5000, 10000, 25000, 50000].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => onChangeForm((f) => ({ ...f, balance: chip }))}
                    className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-white text-gray-700 hover:bg-[#5A8F7B] hover:text-white border border-gray-200 transition-all cursor-pointer active:scale-95 shadow-2xs"
                  >
                    {chip === 0 ? 'No Debt (0)' : `${chip.toLocaleString()} AFN`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions matching DebtPaymentModal */}
        <div className="flex items-center justify-between pt-5 border-t border-gray-100 shrink-0">
          <span className="text-[11px] text-gray-400">
            {isEditing
              ? 'Changes update immediately in Customer Accounts & POS.'
              : 'Customer will be immediately available in POS checkout.'}
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
              {isEditing ? 'Update Customer Account' : 'Save Customer Account'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
