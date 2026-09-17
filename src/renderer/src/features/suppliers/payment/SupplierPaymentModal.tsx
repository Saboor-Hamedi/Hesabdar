import React from 'react'
import { Wallet, Coins } from 'lucide-react'
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
 * SupplierPaymentModal: Modal for paying wholesale vendors to clear payables.
 */
export function SupplierPaymentModal({
  supplier,
  amount,
  onChangeAmount,
  onClose,
  onSubmit,
}: SupplierPaymentModalProps) {
  if (!supplier) return null

  const remaining = Math.max(0, (supplier.balance || 0) - amount)

  return (
    <Modal
      isOpen={Boolean(supplier)}
      onClose={onClose}
      title="Pay Supplier Balance"
      subtitle={`Record payment dispatched to ${supplier.name} ${supplier.company ? `(${supplier.company})` : ''}`}
      badge={
        <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 shadow-2xs">
          SUPP-{String(1000 + supplier.id)}
        </span>
      }
      style={{ width: '580px', maxWidth: '95vw' }}
      bodyClassName="p-8"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-900">{supplier.name}</span>
            {supplier.company && (
              <span className="text-xs text-gray-500 font-medium">{supplier.company}</span>
            )}
            <span className="text-xs text-gray-400 font-mono mt-0.5">{supplier.phone || 'No phone'}</span>
          </div>
          <div className="text-end">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.05em] block">Current Payable</span>
            <span className="text-base font-bold font-mono text-amber-700 mt-0.5 block">
              {formatCurrency(supplier.balance || 0)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
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
              onClick={() => onChangeAmount(supplier.balance || 0)}
              className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              Pay Full ({formatCurrency(supplier.balance || 0)})
            </button>
            {[500, 1000, 2000, 5000, 10000].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => onChangeAmount(chip)}
                className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#F3F4F6] text-gray-700 hover:bg-[#5A8F7B] hover:text-white transition-all cursor-pointer active:scale-95 border-none"
              >
                {chip.toLocaleString()} AFN
              </button>
            ))}
          </div>
        </div>

        {/* Balance Remaining after payment */}
        <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/70 rounded-xl flex items-center justify-between text-xs">
          <span className="text-emerald-900 font-semibold flex items-center gap-2">
            <Coins className="w-4 h-4 text-[#5A8F7B] shrink-0" />
            Remaining Balance:
          </span>
          <span className="font-mono font-bold text-sm text-emerald-800">
            {formatCurrency(remaining)}
          </span>
        </div>

        <div className="flex items-center justify-end gap-6 pt-4 border-t border-gray-100">
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
      </form>
    </Modal>
  )
}
