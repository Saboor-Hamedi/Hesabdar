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
      title="Debt Settlement & Payment Receipt / دریافت بدهی و تصفیه حساب"
      subtitle={`Official transaction receipt and debt collection for ${customer.name}`}
      style={{ width: '900px', height: '700px', maxWidth: '95vw', maxHeight: '92vh' }}
      className="flex flex-col"
      bodyClassName="flex-1 flex flex-col p-6 overflow-y-auto"
    >
      <form onSubmit={handleFormSubmit} className="flex flex-col justify-between h-full gap-5">
        <div className="flex flex-col gap-4">
          {/* Top Debtor Profile Header Card */}
          <div className="p-4 bg-emerald-50/50 border border-emerald-200/90 rounded-[5px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[5px] bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                {customer.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-950">{customer.name}</span>
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-semibold">
                    CUST-{String(1000 + customer.id)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="font-mono">{customer.phone || 'No phone registered'}</span>
                  {customer.address && <span>• {customer.address}</span>}
                </div>
              </div>
            </div>

            <div className="text-end shrink-0">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                {currentDebt > 0
                  ? 'Total Outstanding Debt (بدهی)'
                  : currentDebt < 0
                    ? 'Customer Credit Deposit (طلب مشتری)'
                    : 'Account Balance'}
              </span>
              <span
                className={`text-xl font-black font-mono mt-0.5 block ${
                  currentDebt > 0
                    ? 'text-amber-700'
                    : currentDebt < 0
                      ? 'text-emerald-700'
                      : 'text-gray-600'
                }`}
              >
                {currentDebt < 0
                  ? `+${formatCurrency(Math.abs(currentDebt))}`
                  : formatCurrency(currentDebt)}
              </span>
            </div>
          </div>

          {/* Main 2-Column Settlement Deck */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
            {/* Left Column: Cash Input & Denominations */}
            <div className="p-4 border border-gray-200/90 rounded-[5px] bg-gray-50/40 flex flex-col justify-between gap-3.5">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    Cash Amount Received / مقدار پول دریافتی
                  </span>
                  <span className="text-[10px] text-gray-400">Physical currency collected</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-gray-700">
                    Amount Paid by Customer (AFN) *
                  </label>
                  <div className="flex items-center rounded-[5px] border border-gray-300 bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 shadow-inner overflow-hidden">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0"
                      value={amount || ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                        onChangeAmount(Math.max(0, val))
                      }}
                      required
                      autoFocus
                      className="flex-1 h-11 px-3.5 text-lg font-mono font-black text-gray-900 bg-transparent border-none focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="px-3.5 py-2.5 bg-gray-100 text-xs font-mono font-bold text-gray-600 border-s border-gray-200 select-none">
                      AFN
                    </span>
                  </div>
                </div>

                {/* Quick Banknote Settlement Chips */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    Quick Banknote Presets:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {currentDebt > 0 && (
                      <button
                        type="button"
                        onClick={() => onChangeAmount(currentDebt)}
                        className="px-3 py-1.5 rounded-[5px] text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-2xs cursor-pointer active:scale-95"
                      >
                        Exact Debt ({formatCurrency(currentDebt)})
                      </button>
                    )}
                    {[500, 1000, 2000, 5000, 10000].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => onChangeAmount(chip)}
                        className="px-2.5 py-1.5 rounded-[5px] text-xs font-mono font-semibold bg-white text-gray-800 hover:bg-gray-50 hover:border-emerald-500 border border-gray-200 transition-all shadow-2xs cursor-pointer active:scale-95"
                      >
                        {chip.toLocaleString()} AFN
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Optional Memo / Settlement Note */}
              <div className="pt-2 border-t border-gray-200/80 flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-gray-600 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                  Payment Note / رسید یادداشت (اختیاری)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid in full via cash / تحویل نقدی در دکان"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs border border-gray-200 rounded-[5px] bg-white text-gray-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Right Column: Financial Audit, Overpayment Detection & Change Calculation */}
            <div className="p-4 border border-gray-200/90 rounded-[5px] bg-white flex flex-col justify-between gap-3 shadow-2xs">
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  Financial Settlement Breakdown / محاسبه حساب
                </span>

                {/* Status KPI Rows */}
                <div className="space-y-2 bg-gray-50/70 p-3 rounded-[5px] border border-gray-200/70 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-medium">Opening Outstanding Debt:</span>
                    <span className="font-mono font-bold text-gray-900">
                      {formatCurrency(currentDebt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-medium">Cash Collected:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {formatCurrency(amount)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                    <span className="font-bold text-gray-900">
                      {isOverpaying ? 'Overpayment Amount:' : 'Remaining Debt Balance:'}
                    </span>
                    <span
                      className={`font-mono font-black text-sm ${
                        isOverpaying
                          ? 'text-emerald-700'
                          : remainingDebt === 0
                            ? 'text-emerald-700'
                            : 'text-amber-800'
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
                  <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-[5px] flex flex-col gap-2.5">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-amber-950 block">
                          Customer debt is {formatCurrency(currentDebt)}, but payment is {formatCurrency(amount)}.
                        </span>
                        <span className="text-[11px] text-amber-800 block mt-0.5">
                          بدهی مشتری {formatCurrency(currentDebt)} است، اما {formatCurrency(amount)} پرداخت شد.
                        </span>
                      </div>
                    </div>

                    {/* Change to Return Banner */}
                    <div className="p-2.5 bg-white border border-amber-200 rounded-[4px] flex items-center justify-between shadow-2xs">
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">
                          Change to Return to Customer:
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">
                          باقیمانده پول جهت پس دادن به مشتری
                        </span>
                      </div>
                      <span className="font-mono font-black text-base text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                        {formatCurrency(overpaymentDiff)}
                      </span>
                    </div>

                    {/* Action Choice Radio Tiles */}
                    <div className="flex flex-col gap-2 pt-1">
                      <label
                        className={`p-2.5 rounded-[5px] border cursor-pointer flex items-start gap-2 transition-all ${
                          !keepAsAdvance
                            ? 'bg-white border-emerald-500 shadow-2xs'
                            : 'bg-transparent border-gray-200/80 hover:bg-white/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="debtAction"
                          checked={!keepAsAdvance}
                          onChange={() => setKeepAsAdvance(false)}
                          className="mt-0.5 accent-emerald-600 cursor-pointer"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-900">
                            Return {formatCurrency(overpaymentDiff)} Cash Change (تصفیه و بازپرداخت باقی پول)
                          </span>
                          <span className="text-[10px] text-gray-500 mt-0.5">
                            Customer balance becomes 0 AFN. Hand {formatCurrency(overpaymentDiff)} back to the customer.
                          </span>
                        </div>
                      </label>

                      <label
                        className={`p-2.5 rounded-[5px] border cursor-pointer flex items-start gap-2 transition-all ${
                          keepAsAdvance
                            ? 'bg-white border-emerald-500 shadow-2xs'
                            : 'bg-transparent border-gray-200/80 hover:bg-white/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="debtAction"
                          checked={keepAsAdvance}
                          onChange={() => setKeepAsAdvance(true)}
                          className="mt-0.5 accent-emerald-600 cursor-pointer"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-emerald-800">
                            Save {formatCurrency(overpaymentDiff)} as Advance Credit (ثبت به عنوان طلب مشتری)
                          </span>
                          <span className="text-[10px] text-gray-500 mt-0.5">
                            Customer leaves the extra money in deposit for future purchases.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                ) : remainingDebt === 0 && amount > 0 ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-[5px] flex items-center gap-2 text-xs text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold block">Debt Fully Cleared!</span>
                      <span className="text-[11px] text-emerald-700">
                        Customer account will have 0 AFN balance after this transaction.
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Bottom Notice */}
              <div className="p-2.5 bg-gray-50 rounded-[5px] text-[11px] text-gray-500 border border-gray-100 flex items-center justify-between">
                <span>Receipt is automatically recorded in customer ledger.</span>
                <Receipt className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 shrink-0">
          <span className="text-[11px] text-gray-400">
            Press ESC or Cancel to dismiss without changes.
          </span>

          <div className="flex items-center gap-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>

            {isOverpaying && !keepAsAdvance ? (
              <Button
                variant="primary"
                type="submit"
                icon={<RotateCcw className="w-3.5 h-3.5" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 cursor-pointer"
              >
                Return {formatCurrency(overpaymentDiff)} &amp; Settle
              </Button>
            ) : (
              <Button
                variant="primary"
                type="submit"
                disabled={amount <= 0}
                icon={<Wallet className="w-3.5 h-3.5" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 cursor-pointer"
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
