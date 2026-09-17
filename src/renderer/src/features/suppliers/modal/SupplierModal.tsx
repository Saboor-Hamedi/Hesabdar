import React from 'react'
import { Plus } from 'lucide-react'
import type { SupplierFormValues } from '../../../core/validation/schemas'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'

interface SupplierModalProps {
  isOpen: boolean
  onClose: () => void
  form: SupplierFormValues
  errors: Record<string, string>
  onChangeForm: React.Dispatch<React.SetStateAction<SupplierFormValues>>
  onSubmit: (e: React.FormEvent) => void
}

/**
 * SupplierModal: Form modal for registering new wholesale vendor accounts.
 */
export function SupplierModal({
  isOpen,
  onClose,
  form,
  errors,
  onChangeForm,
  onSubmit,
}: SupplierModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Vendor / Supplier"
      subtitle="Record new wholesale supplier and payable balance."
      badge={
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 shadow-2xs">
          Accounts Payable
        </span>
      }
      style={{ width: '820px', maxWidth: '95vw', maxHeight: '92vh' }}
      className="flex flex-col"
      bodyClassName="flex-1 flex flex-col p-8 overflow-y-auto"
    >
      <form onSubmit={onSubmit} className="flex flex-col justify-between h-full gap-6">
        <div className="flex flex-col gap-5">
          {/* Section 1: Vendor Profile & Contact Information */}
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Representative / Contact Name"
                placeholder="e.g. Haji Bashir, Ahmad Jan"
                value={form.name}
                onChange={(e) => onChangeForm((f) => ({ ...f, name: e.target.value }))}
                error={errors.name}
                required
              />

              <Input
                label="Company / Wholesale Business"
                placeholder="e.g. Pamir Trading Co., Ariana Wholesale"
                value={form.company || ''}
                onChange={(e) => onChangeForm((f) => ({ ...f, company: e.target.value }))}
                error={errors.company}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Primary Phone Number"
                placeholder="0799123456 or +93799123456"
                value={form.phone || ''}
                onChange={(e) => onChangeForm((f) => ({ ...f, phone: e.target.value }))}
                error={errors.phone}
              />

              <Input
                label="Wholesale Market / Shop Address"
                placeholder="e.g. Mandawi Market, Block B / Kabul"
                value=""
                onChange={() => {}}
                disabled
              />
            </div>
          </div>

          {/* Section 2: Financial Ledger & Opening Debt */}
          <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B7280]">
                Opening Payable Balance &amp; Credit Terms
              </span>
              {form.balance > 0 && (
                <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200/70 px-2.5 py-0.5 rounded-full">
                  Opening Payable: {form.balance.toLocaleString()} AFN
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              <Input
                label="Initial Payable Balance"
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
                {[0, 5000, 10000, 25000, 50000, 100000, 250000].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => onChangeForm((f) => ({ ...f, balance: chip }))}
                    className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#F3F4F6] text-gray-700 hover:bg-[#5A8F7B] hover:text-white transition-all cursor-pointer active:scale-95 border-none"
                  >
                    {chip === 0 ? 'Clear (0)' : `${chip.toLocaleString()} AFN`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-5 border-t border-gray-100 shrink-0">
          <span className="text-[11px] text-gray-400">
            Registered supplier will be available for inventory orders and ledger settlements.
          </span>
          <div className="flex items-center gap-6">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              icon={<Plus className="w-4 h-4" />}
            >
              Save Supplier / Vendor
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
