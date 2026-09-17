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
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div className="p-3 bg-gray-50 border border-gray-100 rounded-[5px] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-800">{supplier.name}</span>
            {supplier.company && (
              <span className="text-[11px] text-gray-500 font-medium">{supplier.company}</span>
            )}
            <span className="text-[10px] text-gray-400 font-mono">{supplier.phone || 'No phone'}</span>
          </div>
          <div className="text-end">
            <span className="text-[10px] text-gray-400 block font-medium">Current Payable Balance</span>
            <span className="text-sm font-bold font-mono text-amber-700">
              {formatCurrency(supplier.balance || 0)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Input
            label="Payment Amount Dispatched (AFN) *"
            type="number"
            placeholder="Enter amount to pay"
            value={amount || ''}
            onChange={(e) => onChangeAmount(Math.max(0, parseFloat(e.target.value) || 0))}
            required
          />

          {/* Quick denomination banknote chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <button
              type="button"
              onClick={() => onChangeAmount(supplier.balance || 0)}
              className="px-2.5 py-1 rounded-[5px] text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              Pay Full ({formatCurrency(supplier.balance || 0)})
            </button>
            {[500, 1000, 2000, 5000, 10000].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => onChangeAmount(chip)}
                className="px-2 py-1 rounded-[5px] text-[10px] font-mono font-medium bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 transition-all shadow-2xs cursor-pointer active:scale-95"
              >
                {chip.toLocaleString()} AFN
              </button>
            ))}
          </div>
        </div>

        {/* Balance Remaining after payment */}
        <div className="p-2.5 bg-emerald-50/50 border border-emerald-200/80 rounded-[5px] flex items-center justify-between text-xs">
          <span className="text-emerald-900 font-semibold flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            Remaining Balance:
          </span>
          <span className="font-mono font-black text-sm text-emerald-800">
            {formatCurrency(remaining)}
          </span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={amount <= 0}
            icon={<Wallet className="w-3.5 h-3.5" />}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            Confirm Supplier Payment
          </Button>
        </div>
      </form>
    </Modal>
  )
}
