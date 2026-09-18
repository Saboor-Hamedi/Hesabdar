import React from 'react'
import { Wallet, Coins, CheckCircle2 } from 'lucide-react'
import type { Supplier } from '../../../core/types'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { formatCurrency } from '../../../core/utils/formatters'

interface SupplierPaymentModalProps {
  supplier: Supplier | null
  amount: number
  onChangeAmount: (val: number) => void
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

/**
 * SupplierPaymentModal: Executive wholesale vendor payment receipt & disbursement modal (920px x 700px).
 * Styled consistently with DebtPaymentModal with top profile card and structured settlement deck.
 */
export function SupplierPaymentModal({
  supplier,
  amount,
  onChangeAmount,
  onClose,
  onSubmit,
}: SupplierPaymentModalProps) {
  if (!supplier) return null

  const currentPayable = supplier.balance || 0
  const remaining = Math.max(0, currentPayable - amount)
  const initials = supplier.name.trim() ? supplier.name.trim().slice(0, 2).toUpperCase() : 'VN'

  return (
    <Modal
      isOpen={Boolean(supplier)}
      onClose={onClose}
      title="Vendor Debt Settlement &amp; Disbursement Receipt"
      subtitle={`Official transaction receipt and payment settlement for ${supplier.name}`}
      badge={
        <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 shadow-2xs">
          SUPP-{String(1000 + supplier.id)}
        </span>
      }
      style={{ width: '920px', maxWidth: '95vw', maxHeight: '92vh' }}
      className="flex flex-col"
      bodyClassName="flex-1 flex flex-col p-8 overflow-y-auto"
    >
      <form onSubmit={onSubmit} className="flex flex-col justify-between h-full gap-6">
        <div className="flex flex-col gap-5">
          {/* Top Vendor Profile Header Card matching DebtPaymentModal */}
          <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#5A8F7B] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                {initials}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900">{supplier.name}</span>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                  {supplier.company && <span>{supplier.company}</span>}
                  {supplier.company && <span>•</span>}
                  <span className="font-mono">{supplier.phone || 'No phone'}</span>
                </div>
              </div>
            </div>

            <div className="text-end shrink-0">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.05em] block">
                Total Payable Balance
              </span>
              <span className="text-xl font-bold font-mono text-amber-700 mt-0.5 block">
                {formatCurrency(currentPayable)}
              </span>
            </div>
          </div>

          {/* Main 2-Column Settlement Deck */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1">
            {/* Left Column: Cash Input & Quick Banknote Presets */}
            <div className="p-5 border border-gray-100 rounded-xl bg-gray-50/50 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5 uppercase tracking-[0.05em]">
                    <Wallet className="w-4 h-4 text-[#5A8F7B]" />
                    Cash Amount Dispatched
                  </span>
                  <span className="text-xs font-mono text-gray-500">Currency: AFN</span>
                </div>

                <Input
                  label="Payment Amount Dispatched"
                  type="number"
                  placeholder="0"
                  suffix="AFN"
                  className="text-right font-mono text-base font-bold"
                  value={amount || ''}
                  onChange={(e) => onChangeAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  required
                />

                {/* Quick denomination banknote chips */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <button
                    type="button"
                    onClick={() => onChangeAmount(currentPayable)}
                    className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#5A8F7B] hover:bg-[#4a7766] text-white transition-all shadow-2xs cursor-pointer active:scale-95"
                  >
                    Pay Full ({formatCurrency(currentPayable)})
                  </button>
                  {[500, 1000, 2000, 5000, 10000].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => onChangeAmount(chip)}
                      className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-white text-gray-700 hover:bg-[#5A8F7B] hover:text-white border border-gray-200 transition-all cursor-pointer active:scale-95 shadow-2xs"
                    >
                      {chip.toLocaleString()} AFN
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Ledger Accounting Settlement Breakdown */}
            <div className="p-5 border border-gray-100 rounded-xl bg-gray-50/50 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-gray-800 uppercase tracking-[0.05em] flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-[#5A8F7B]" />
                  Accounts Payable Summary
                </span>

                <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 flex flex-col gap-2.5 shadow-2xs">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Initial Debt to Vendor:</span>
                    <span className="font-mono font-semibold text-gray-900">{formatCurrency(currentPayable)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-emerald-800">
                    <span>Payment Dispatched:</span>
                    <span className="font-mono font-semibold text-emerald-700">- {formatCurrency(amount)}</span>
                  </div>
                  <div className="border-t border-gray-100 pt-2 flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-800">Remaining Payable:</span>
                    <span className="font-mono text-base text-gray-900">{formatCurrency(remaining)}</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/50 border border-emerald-200/60 rounded-xl flex items-center gap-2 text-xs text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {remaining === 0
                      ? 'This supplier balance will be completely settled upon confirmation.'
                      : `Supplier balance will be reduced to ${formatCurrency(remaining)}.`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions matching DebtPaymentModal */}
        <div className="flex items-center justify-between pt-5 border-t border-gray-100 shrink-0">
          <span className="text-[11px] text-gray-400">
            Payment records will be timestamped and updated in supplier accounts.
          </span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={amount <= 0}
              icon={<Wallet className="w-4 h-4" />}
            >
              Confirm Supplier Payment
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
