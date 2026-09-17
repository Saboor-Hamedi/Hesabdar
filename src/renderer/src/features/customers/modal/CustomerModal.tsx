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
      title={isEditing ? 'Edit Customer Account' : 'Add Customer Account'}
      subtitle={
        isEditing
          ? 'Update debtor contact information, address, and running balance.'
          : 'Record new customer contact details and credit balance.'
      }
      style={{ width: '900px', height: '700px', maxWidth: '95vw', maxHeight: '92vh' }}
      className="flex flex-col"
      bodyClassName="flex-1 flex flex-col p-6 overflow-y-auto"
    >
      <form onSubmit={onSubmit} className="flex flex-col justify-between h-full gap-5">
        <div className="flex flex-col gap-4">
          {/* Top Informational Banner */}
          <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/80 rounded-[5px] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-emerald-950">
                {isEditing ? `Editing Customer Profile #${editingCustomer?.id}` : 'Customer Credit Account Registry'}
              </span>
              <span className="text-[11px] text-emerald-800/80 mt-0.5">
                {isEditing
                  ? 'Modifications reflect automatically across POS checkout and customer ledger.'
                  : 'Register customer contact profiles, credit allowances, and initial balance for POS billing.'}
              </span>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-[5px] bg-emerald-600 text-white shadow-2xs">
              Accounts Receivable
            </span>
          </div>

          {/* Section 1: Customer Profile & Contact Details */}
          <div className="p-4 border border-gray-200/90 rounded-[5px] bg-gray-50/40 flex flex-col gap-3.5">
            <div className="text-xs font-semibold text-gray-800 flex items-center justify-between">
              <span>Customer Identification &amp; Contact Details</span>
              <span className="text-[10px] font-normal text-gray-400">
                Primary debtor contact profile
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Customer Full Name *"
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

            <div className="grid grid-cols-1 gap-3.5">
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
          <div className="p-4 border border-gray-200/90 rounded-[5px] bg-gray-50/40 flex flex-col gap-3.5">
            <div className="text-xs font-semibold text-gray-800 flex items-center justify-between">
              <span>{isEditing ? 'Current Debt Balance (AFN)' : 'Opening Debt Balance & Credit Ledger'}</span>
              {form.balance > 0 && (
                <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-[5px]">
                  Balance Due: {form.balance.toLocaleString()} AFN
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Input
                label={isEditing ? 'Current Outstanding Debt Balance (AFN)' : 'Initial Debt / Credit Balance (AFN)'}
                type="number"
                placeholder="0"
                value={form.balance || ''}
                onChange={(e) => onChangeForm((f) => ({ ...f, balance: parseFloat(e.target.value) || 0 }))}
                error={errors.balance}
              />

              {/* Quick Banknote Settlement Presets */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[10px] text-gray-500 font-medium">Quick Amounts:</span>
                {[0, 1000, 2000, 5000, 10000, 25000, 50000].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => onChangeForm((f) => ({ ...f, balance: chip }))}
                    className="px-2.5 py-1 rounded-[5px] text-[10px] font-mono font-medium bg-white text-gray-700 hover:bg-gray-50 hover:border-emerald-500 border border-gray-200 transition-all shadow-2xs cursor-pointer active:scale-95"
                  >
                    {chip === 0 ? 'No Debt (0)' : `${chip.toLocaleString()} AFN`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 shrink-0">
          <span className="text-[11px] text-gray-400">
            {isEditing
              ? 'Changes update immediately in Customer Accounts & POS.'
              : 'Customer will be immediately available in POS checkout for credit/debt sales.'}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              icon={isEditing ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 cursor-pointer"
            >
              {isEditing ? 'Update Customer Account' : 'Save Customer Account'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
