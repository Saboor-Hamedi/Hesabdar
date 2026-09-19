import { useState, type FormEvent } from 'react'
import {
  Wallet,
  Coins,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Banknote,
  Receipt,
  FileText,
} from 'lucide-react'
import type { Customer } from '../../../core/types'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { formatCurrency } from '../../../core/utils/formatters'

interface DebtPaymentModalProps {
  isOpen?: boolean
  customer: Customer | null
  amount: number
  onChangeAmount: (val: number) => void
  onClose: () => void
  onSubmit: (e: FormEvent, customAmount?: number, note?: string) => void
}

/**
 * DebtPaymentModal: Executive 900px x 700px payment settlement dialog.
 * Layered with zIndex={70} to always appear prominently on top of the Customer Ledger modal.
 * Features comprehensive overpayment detection, live change calculation, and advance credit handling.
 */
export function DebtPaymentModal({
  isOpen,
  customer,
  amount,
  onChangeAmount,
  onClose,
  onSubmit,
}: DebtPaymentModalProps) {
  const [keepAsAdvance, setKeepAsAdvance] = useState(false)
  const [paymentNote, setPaymentNote] = useState('')

  if (!customer) return null

  const currentDebt = customer.balance || 0
  const isOverpaying = currentDebt > 0 && amount > currentDebt
  const overpaymentDiff = isOverpaying ? Math.round((amount - currentDebt) * 100) / 100 : 0
  const remainingDebt = Math.max(0, currentDebt - amount)

  // Handle direct "Settle exact debt and return change" action
  const handleSettleExactAndReturnChange = (e: FormEvent) => {
    e.preventDefault()
    const autoNote =
      paymentNote.trim() ||
      `Settled exact debt of ${formatCurrency(currentDebt)}. Received ${formatCurrency(amount)}, returned ${formatCurrency(overpaymentDiff)} change in cash.`
    onSubmit(e, currentDebt, autoNote)
  }

  // Handle standard form submit
  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (isOverpaying && !keepAsAdvance) {
      handleSettleExactAndReturnChange(e)
    } else if (isOverpaying && keepAsAdvance) {
      const autoNote =
        paymentNote.trim() ||
        `Received ${formatCurrency(amount)}: cleared ${formatCurrency(currentDebt)} debt + ${formatCurrency(overpaymentDiff)} recorded as customer advance credit.`
      onSubmit(e, amount, autoNote)
    } else {
      onSubmit(e, amount, paymentNote.trim() || undefined)
    }
  }

  return (
    <Modal
      isOpen={isOpen !== undefined ? isOpen : Boolean(customer)}
      onClose={onClose}
      zIndex={70}
      title="Debt Settlement & Payment Receipt"
      subtitle={`Official transaction receipt and debt collection for ${customer.name}`}
      badge={
        <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs">
          CUST-{String(1000 + customer.id)}
        </span>
      }
      style={{ width: '920px', maxWidth: '95vw', maxHeight: '92vh' }}
      className="flex flex-col"
      bodyClassName="flex-1 flex flex-col p-8 overflow-y-auto"
    >
      <form onSubmit={handleFormSubmit} className="flex flex-col justify-between h-full gap-6">
        <div className="flex flex-col gap-5">
          {/* Top Debtor Profile Header Card */}
          <div className="p-4 bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#5A8F7B] text-white flex items-center justify-center font-bold text-base shadow-xs">
                {customer.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900 dark:text-slate-100">{customer.name}</span>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                  <span className="font-mono">{customer.phone || 'No phone'}</span>
                  {customer.address && <span>• {customer.address}</span>}
                </div>
              </div>
            </div>

            <div className="text-end shrink-0">
              <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-[0.05em] block">
                {currentDebt > 0
                  ? 'Total Outstanding Debt'
                  : currentDebt < 0
                    ? 'Customer Credit Deposit'
                    : 'Account Settled'}
              </span>
              <span
                className={`text-xl font-bold font-mono mt-0.5 block ${
                  currentDebt > 0
                    ? 'text-amber-700 dark:text-amber-400'
                    : currentDebt < 0
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-gray-600 dark:text-slate-400'
                }`}
              >
                {currentDebt < 0
                  ? `+${formatCurrency(Math.abs(currentDebt))}`
                  : formatCurrency(currentDebt)}
              </span>
            </div>
          </div>

          {/* Main 2-Column Settlement Deck */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1">
            {/* Left Column: Cash Input & Denominations */}
            <div className="p-5 border border-gray-100 dark:border-slate-800 rounded-xl bg-gray-50/50 dark:bg-slate-800/40 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-[#5A8F7B]" />
                    Cash Amount Received
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-slate-500">Physical currency collected</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Input
                    label="Amount Paid by Customer"
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    suffix="AFN"
                    className="text-right font-mono text-base font-bold"
                    value={amount || ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                      onChangeAmount(Math.max(0, val))
                    }}
                    required
                    autoFocus
                  />
                </div>

                {/* Quick Banknote Settlement Chips */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                    Quick Banknote Presets:
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {currentDebt > 0 && (
                      <button
                        type="button"
                        onClick={() => onChangeAmount(currentDebt)}
                        className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-2xs cursor-pointer active:scale-95"
                      >
                        Exact Debt ({formatCurrency(currentDebt)})
                      </button>
                    )}
                    {[500, 1000, 2000, 5000, 10000].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => onChangeAmount(chip)}
                        className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#F3F4F6] dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-[#5A8F7B] hover:text-white dark:hover:bg-[#5A8F7B] dark:hover:text-white border border-gray-200/50 dark:border-slate-700 transition-all cursor-pointer active:scale-95"
                      >
                        {chip.toLocaleString()} AFN
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Optional Memo / Settlement Note */}
              <div className="pt-3 border-t border-gray-100 dark:border-slate-800 flex flex-col gap-1.5">
                <Input
                  label="Payment Note / Memo (Optional)"
                  placeholder="e.g. Paid in full via cash / تحویل نقدی در دکان"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  startIcon={<FileText className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />}
                />
              </div>
            </div>

            {/* Right Column: Financial Audit, Overpayment Detection & Change Calculation */}
            <div className="p-5 border border-gray-100 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 flex flex-col justify-between gap-4 shadow-xs">
              <div className="flex flex-col gap-3.5">
                <span className="text-xs font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-[#5A8F7B]" />
                  Financial Settlement Breakdown
                </span>

                {/* Status KPI Rows */}
                <div className="space-y-2.5 bg-gray-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-gray-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-slate-400 font-medium">Opening Outstanding Debt:</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-slate-100">
                      {formatCurrency(currentDebt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-slate-400 font-medium">Cash Collected:</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(amount)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="font-bold text-gray-900 dark:text-slate-100">
                      {isOverpaying ? 'Overpayment Amount:' : 'Remaining Debt Balance:'}
                    </span>
                    <span
                      className={`font-mono font-black text-sm ${
                        isOverpaying
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : remainingDebt === 0
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-amber-800 dark:text-amber-400'
                      }`}
                    >
                      {isOverpaying
                        ? `+${formatCurrency(overpaymentDiff)} (Extra)`
                        : remainingDebt === 0
                          ? '0 AFN (Fully Settled)'
                          : formatCurrency(remainingDebt)}
                    </span>
                  </div>
                </div>

                {/* OVERPAYMENT ALERT & ACTION CHOICE */}
                {isOverpaying ? (
                  <div className="p-3.5 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex flex-col gap-2.5">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-amber-950 dark:text-amber-200 block">
                          Customer debt is {formatCurrency(currentDebt)}, but payment is {formatCurrency(amount)}.
                        </span>
                        <span className="text-[11px] text-amber-800 dark:text-amber-300 block mt-0.5">
                          بدهی مشتری {formatCurrency(currentDebt)} است، اما {formatCurrency(amount)} پرداخت شد.
                        </span>
                      </div>
                    </div>

                    {/* Change to Return Banner */}
                    <div className="p-2.5 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800/60 rounded-lg flex items-center justify-between shadow-2xs">
                      <div>
                        <span className="text-xs font-bold text-gray-900 dark:text-slate-100 block">
                          Change to Return:
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">
                          باقیمانده پول جهت پس دادن به مشتری
                        </span>
                      </div>
                      <span className="font-mono font-bold text-base text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
                        {formatCurrency(overpaymentDiff)}
                      </span>
                    </div>

                    {/* Action Choice Radio Tiles */}
                    <div className="flex flex-col gap-2 pt-1">
                      <label
                        className={`p-2.5 rounded-lg border cursor-pointer flex items-start gap-2 transition-all ${
                          !keepAsAdvance
                            ? 'bg-white dark:bg-slate-800 border-[#5A8F7B] shadow-2xs'
                            : 'bg-transparent border-gray-200/80 dark:border-slate-700 hover:bg-white/50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="debtAction"
                          checked={!keepAsAdvance}
                          onChange={() => setKeepAsAdvance(false)}
                          className="mt-0.5 accent-[#5A8F7B] cursor-pointer"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-900 dark:text-slate-100">
                            Return {formatCurrency(overpaymentDiff)} Cash Change
                          </span>
                          <span className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">
                            Customer balance becomes 0 AFN. Hand {formatCurrency(overpaymentDiff)} back in cash.
                          </span>
                        </div>
                      </label>

                      <label
                        className={`p-2.5 rounded-lg border cursor-pointer flex items-start gap-2 transition-all ${
                          keepAsAdvance
                            ? 'bg-white dark:bg-slate-800 border-[#5A8F7B] shadow-2xs'
                            : 'bg-transparent border-gray-200/80 dark:border-slate-700 hover:bg-white/50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="debtAction"
                          checked={keepAsAdvance}
                          onChange={() => setKeepAsAdvance(true)}
                          className="mt-0.5 accent-[#5A8F7B] cursor-pointer"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                            Save {formatCurrency(overpaymentDiff)} as Advance Credit
                          </span>
                          <span className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">
                            Customer leaves extra money on deposit for future purchases (طلب مشتری).
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                ) : remainingDebt === 0 && amount > 0 ? (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-2 text-xs text-emerald-900 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold block">Debt Fully Cleared!</span>
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        Customer account balance will be 0 AFN after this transaction.
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Bottom Notice */}
              <div className="p-2.5 bg-gray-50 dark:bg-slate-800/50 rounded-lg text-[11px] text-gray-500 dark:text-slate-400 border border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <span>Receipt is automatically recorded in customer ledger.</span>
                <Receipt className="w-4 h-4 text-gray-400 dark:text-slate-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between pt-5 border-t border-gray-100 dark:border-slate-800 shrink-0">
          <span className="text-[11px] text-gray-400 dark:text-slate-400">
            Press ESC or Cancel to dismiss without changes.
          </span>

          <div className="flex items-center gap-6">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>

            {isOverpaying && !keepAsAdvance ? (
              <Button
                variant="primary"
                type="submit"
                icon={<RotateCcw className="w-4 h-4" />}
              >
                Return {formatCurrency(overpaymentDiff)} &amp; Settle
              </Button>
            ) : (
              <Button
                variant="primary"
                type="submit"
                disabled={amount <= 0}
                icon={<Wallet className="w-4 h-4" />}
              >
                {isOverpaying && keepAsAdvance
                  ? `Save ${formatCurrency(amount)} (with Credit)`
                  : 'Confirm Payment Receipt'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default DebtPaymentModal
