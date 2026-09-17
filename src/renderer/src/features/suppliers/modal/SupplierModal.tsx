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
      style={{ width: '900px', height: '700px', maxWidth: '95vw', maxHeight: '92vh' }}
      className="flex flex-col"
      bodyClassName="flex-1 flex flex-col p-6 overflow-y-auto"
    >
      <form onSubmit={onSubmit} className="flex flex-col justify-between h-full gap-5">
        <div className="flex flex-col gap-4">
          {/* Top Informational Banner */}
          <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/80 rounded-[5px] flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-emerald-950">Wholesale Vendor Registration</span>
              <span className="text-[11px] text-emerald-800/80 mt-0.5">
                Maintain accurate records of vendor payables, contact reps, and wholesale supply terms.
              </span>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-[5px] bg-emerald-600 text-white shadow-2xs">
              Accounts Payable
            </span>
          </div>

          {/* Section 1: Vendor Profile & Contact Information */}
          <div className="p-4 border border-gray-200/90 rounded-[5px] bg-gray-50/40 flex flex-col gap-3.5">
            <div className="text-xs font-semibold text-gray-800 flex items-center justify-between">
              <span>Vendor Profile &amp; Contact Details</span>
              <span className="text-[10px] font-normal text-gray-400">
                Primary wholesale contact representative
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Input
                label="Representative / Contact Name *"
                placeholder="e.g. Haji Bashir, Ahmad Jan"
                value={form.name}
                onChange={(e) => onChangeForm((f) => ({ ...f, name: e.target.value }))}
                error={errors.name}
                required
              />

              <Input
                label="Company / Wholesale Business Name"
                placeholder="e.g. Pamir Trading Co., Ariana Wholesale"
                value={form.company || ''}
                onChange={(e) => onChangeForm((f) => ({ ...f, company: e.target.value }))}
                error={errors.company}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
          <div className="p-4 border border-gray-200/90 rounded-[5px] bg-gray-50/40 flex flex-col gap-3.5">
            <div className="text-xs font-semibold text-gray-800 flex items-center justify-between">
              <span>Opening Payable Balance &amp; Credit Terms</span>
              {form.balance > 0 && (
                <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-[5px]">
                  Opening Payable: {form.balance.toLocaleString()} AFN
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Input
                label="Initial Payable Balance (AFN)"
                type="number"
                placeholder="0"
                value={form.balance || ''}
                onChange={(e) => onChangeForm((f) => ({ ...f, balance: parseFloat(e.target.value) || 0 }))}
                error={errors.balance}
              />

              {/* Quick Banknote Settlement Presets */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[10px] text-gray-500 font-medium">Quick Amounts:</span>
                {[0, 5000, 10000, 25000, 50000, 100000, 250000].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => onChangeForm((f) => ({ ...f, balance: chip }))}
                    className="px-2.5 py-1 rounded-[5px] text-[10px] font-mono font-medium bg-white text-gray-700 hover:bg-gray-50 hover:border-emerald-500 border border-gray-200 transition-all shadow-2xs cursor-pointer active:scale-95"
                  >
                    {chip === 0 ? 'Clear (0)' : `${chip.toLocaleString()} AFN`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 shrink-0">
          <span className="text-[11px] text-gray-400">
            Registered supplier will be available for inventory orders and ledger settlements.
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              icon={<Plus className="w-3.5 h-3.5" />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4"
            >
              Save Supplier / Vendor
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
