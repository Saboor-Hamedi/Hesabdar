import React from 'react'
import { Plus, Building2, Wallet } from 'lucide-react'
import type { SupplierFormValues } from '../../../core/validation/schemas'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { formatCurrency } from '../../../core/utils/formatters'

interface SupplierModalProps {
  isOpen: boolean
  onClose: () => void
  form: SupplierFormValues
  errors: Record<string, string>
  onChangeForm: React.Dispatch<React.SetStateAction<SupplierFormValues>>
  onSubmit: (e: React.FormEvent) => void
}

/**
 * SupplierModal: Executive wholesale vendor registry modal (920px x 700px).
 * Styled consistently with DebtPaymentModal with top profile card and structured decks.
 */
export function SupplierModal({
  isOpen,
  onClose,
  form,
  errors,
  onChangeForm,
  onSubmit,
}: SupplierModalProps) {
  const currentPayable = form.balance || 0
  const initials = form.name.trim() ? form.name.trim().slice(0, 2).toUpperCase() : 'VN'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Vendor &amp; Wholesale Supplier Registry"
      subtitle="Register new wholesale merchandise supplier, company contacts, and credit line."
      badge={
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 shadow-2xs">
          Accounts Payable
        </span>
      }
      style={{ width: '920px', maxWidth: '95vw', maxHeight: '92vh' }}
      className="flex flex-col"
      bodyClassName="flex-1 flex flex-col p-8 overflow-y-auto"
    >
      <form onSubmit={onSubmit} className="flex flex-col justify-between h-full gap-6">
        <div className="flex flex-col gap-5">
          {/* Top Profile Header Card matching DebtPaymentModal */}
          <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#5A8F7B] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                {initials}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900">
                  {form.name || 'New Wholesale Vendor'}
                </span>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                  <span>{form.company || 'Private Distributor'}</span>
                  <span>•</span>
                  <span className="font-mono">{form.phone || 'No phone entered'}</span>
                </div>
              </div>
            </div>

            <div className="text-end shrink-0">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.05em] block">
                Opening Payable Balance
              </span>
              <span
                className={`text-xl font-bold font-mono mt-0.5 block ${
                  currentPayable > 0 ? 'text-amber-700' : 'text-gray-600'
                }`}
              >
                {currentPayable > 0 ? formatCurrency(currentPayable) : '0 AFN (Clean Account)'}
              </span>
            </div>
          </div>

          {/* Section 1: Vendor Profile & Contact Information in Structured Deck */}
          <div className="p-5 border border-gray-100 rounded-xl bg-gray-50/50 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-[0.05em] flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#5A8F7B]" />
                Vendor Profile &amp; Company Details
              </span>
            </div>

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

            <div className="grid grid-cols-1">
              <Input
                label="Primary Phone Number"
                placeholder="0799123456 or 0701234567"
                value={form.phone || ''}
                onChange={(e) => onChangeForm((f) => ({ ...f, phone: e.target.value }))}
                error={errors.phone}
              />
            </div>
          </div>

          {/* Section 2: Financial Ledger & Opening Debt in Structured Deck */}
          <div className="p-5 border border-gray-100 rounded-xl bg-gray-50/50 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-[0.05em] flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-[#5A8F7B]" />
                Opening Payable Balance &amp; Credit Terms
              </span>
              {currentPayable > 0 && (
                <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200/70 px-2.5 py-0.5 rounded-full">
                  Opening Payable: {formatCurrency(currentPayable)}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Input
                label="Initial Payable Balance (We owe supplier)"
                type="number"
                placeholder="0"
                suffix="AFN"
                className="text-right font-mono text-base font-bold"
                value={form.balance || ''}
                onChange={(e) => onChangeForm((f) => ({ ...f, balance: parseFloat(e.target.value) || 0 }))}
                error={errors.balance}
              />

              {/* Quick Banknote Presets */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[11px] text-gray-500 font-medium">Quick Amounts:</span>
                {[0, 5000, 10000, 25000, 50000, 100000].map((chip) => (
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
            Wholesale invoices from this supplier will be tracked in Accounts Payable.
          </span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" icon={<Plus className="w-4 h-4" />}>
              Save Vendor Account
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
