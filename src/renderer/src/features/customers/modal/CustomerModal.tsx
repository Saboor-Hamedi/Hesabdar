import React from 'react'
import { Plus, Check } from 'lucide-react'
import type { CustomerFormValues } from '../../../core/validation/schemas'
import type { Customer } from '../../../core/types'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'

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
 * CustomerModal: Form modal for creating and updating customer debt and contact records (900px x 700px).
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Editing Customer Profile #${editingCustomer?.id}` : 'Customer Account Registry'}
      subtitle={
        isEditing
          ? 'Modifications reflect automatically across POS checkout and customer ledger.'
          : 'Register customer contact profiles, credit allowances, and initial balance for POS billing.'
      }
      badge={
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 shadow-2xs">
          Accounts Receivable
        </span>
      }
      style={{ width: '820px', maxWidth: '95vw', maxHeight: '92vh' }}
      className="flex flex-col"
      bodyClassName="flex-1 flex flex-col p-8 overflow-y-auto"
    >
      <form onSubmit={onSubmit} className="flex flex-col justify-between h-full gap-6">
        <div className="flex flex-col gap-5">
          {/* Section 1: Customer Profile & Contact Details */}
          <div className="flex flex-col gap-4">
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
                placeholder="0799123456 or +93799123456"
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

          {/* Section 2: Financial Ledger & Opening Debt */}
          <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B7280]">
                {isEditing ? 'Current Debt Balance' : 'Opening Debt Balance'}
              </span>
              {form.balance > 0 && (
                <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200/70 px-2.5 py-0.5 rounded-full">
                  Balance Due: {form.balance.toLocaleString()} AFN
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              <Input
                label={isEditing ? 'Outstanding Balance' : 'Initial Balance'}
                type="number"
                placeholder="0"
                suffix="AFN"
                className="text-right font-mono"
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
                    className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#F3F4F6] text-gray-700 hover:bg-[#5A8F7B] hover:text-white transition-all cursor-pointer active:scale-95 border-none"
                  >
                    {chip === 0 ? 'No Debt (0)' : `${chip.toLocaleString()} AFN`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-5 border-t border-gray-100 shrink-0">
          <span className="text-[11px] text-gray-400">
            {isEditing
              ? 'Changes update immediately in Customer Accounts & POS.'
              : 'Customer will be immediately available in POS checkout.'}
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
              {isEditing ? 'Update Customer Account' : 'Save Customer Account'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
