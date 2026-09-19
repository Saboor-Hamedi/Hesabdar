import { useTranslation } from 'react-i18next'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { Customer, PaymentMode } from '../../../core/types'
import { formatNumber } from '../../../core/utils/formatters'
import { CustomerSelectInput } from './CustomerSelectInput'

interface SettlementPanelProps {
  subtotal: number
  discount: number
  onChangeDiscount: (val: number) => void
  total: number
  cashPaid: number
  onChangeCashPaid: (val: number) => void
  paymentMode: PaymentMode
  onChangePaymentMode: (mode: PaymentMode) => void
  customers: Customer[]
  selectedCustomerId: number | null
  onSelectCustomer: (id: number | null) => void
  onOpenAddCustomer?: () => void
  onOpenCustomerLedger?: (customer: Customer) => void
  isCheckoutComplete?: boolean
  completedInvoiceNo?: string
}

/**
 * SettlementPanel: Sleek, compact financial settlement card.
 * Streamlined to eliminate any right sidebar scrollbar.
 */
export function SettlementPanel({
  subtotal,
  discount,
  onChangeDiscount,
  total,
  cashPaid,
  onChangeCashPaid,
  paymentMode,
  onChangePaymentMode,
  customers,
  selectedCustomerId,
  onSelectCustomer,
  onOpenAddCustomer,
  onOpenCustomerLedger,
  isCheckoutComplete = false,
  completedInvoiceNo,
}: SettlementPanelProps) {
  const { t } = useTranslation()
  const isCredit = paymentMode === 'credit'
  const isCard = paymentMode === 'card'
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)

  // When checkout is complete, all display prices on the right side are cleared (0 AFN)
  const displaySubtotal = isCheckoutComplete ? 0 : subtotal
  const displayDiscount = isCheckoutComplete ? 0 : discount
  const displayTotal = isCheckoutComplete ? 0 : total
  const displayPaid = isCheckoutComplete ? 0 : (isCard ? total : cashPaid)

  // Real-time calculation of change, shortage, and debt
  const effectivePaid = isCard ? displayTotal : displayPaid
  const change = effectivePaid > displayTotal ? Math.round((effectivePaid - displayTotal) * 100) / 100 : 0
  const shortage = displayTotal > effectivePaid ? Math.round((displayTotal - effectivePaid) * 100) / 100 : 0
  const isExact = effectivePaid === displayTotal && displayTotal > 0
  const hasPartialCash = !isCredit && !isCard && displayPaid > 0 && displayPaid < displayTotal

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-[8px] p-2.5 shadow-xs flex flex-col gap-1.5 shrink-0">
      {/* 1. Customer Search & Payment Method Selector */}
      <div className="flex items-center gap-1.5 min-w-0 w-full">
        <CustomerSelectInput
          customers={customers}
          selectedCustomerId={isCheckoutComplete ? null : selectedCustomerId}
          onSelectCustomer={onSelectCustomer}
          onOpenAddCustomer={onOpenAddCustomer}
          onOpenCustomerLedger={onOpenCustomerLedger}
        />

        <select
          value={paymentMode}
          onChange={(e) => onChangePaymentMode(e.target.value as PaymentMode)}
          className="h-7.5 px-2 text-xs border border-gray-200 dark:border-slate-700 rounded-[6px] bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 font-semibold focus:outline-none focus:border-[#4A7C6F] dark:focus:border-[#5A8F7B] cursor-pointer shrink-0"
        >
          <option value="cash">{t('pos.cash')}</option>
          <option value="credit">{t('pos.credit')}</option>
          <option value="card">{t('pos.card')}</option>
        </select>
      </div>

      {/* 2. Financial Stack per prompt.md */}
      <div className="space-y-1.5 bg-gray-50/70 dark:bg-slate-800/60 p-2.5 rounded-xl border border-gray-200/70 dark:border-slate-800 text-xs">
        {/* GROUP 1: The Calculation (Static) */}
        <div className="space-y-1.5">
          {/* Subtotal row */}
          <div className="flex items-center justify-between h-6.5">
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400">{t('pos.subtotal')}</span>
            <div className="flex items-center justify-end font-mono">
              <span className="font-mono font-semibold text-gray-800 dark:text-slate-200 text-xs">
                {formatNumber(displaySubtotal)}
              </span>
              <span className="text-gray-400 dark:text-slate-500 font-mono text-xs select-none pointer-events-none">&nbsp;AFN</span>
            </div>
          </div>

          {/* Discount row: compact input */}
          <div className="flex items-center justify-between h-7.5 gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400">{t('pos.discount')}</span>
            <div className="relative w-36 h-7.5">
              <input
                type="number"
                step="any"
                min="0"
                value={displayDiscount || ''}
                onChange={(e) => onChangeDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                disabled={isCheckoutComplete}
                className={`w-full h-full bg-[#F3F4F6] dark:bg-slate-800 hover:bg-[#E5E7EB]/70 dark:hover:bg-slate-700/70 focus:bg-white dark:focus:bg-slate-900 text-end text-xs font-mono font-medium rounded-lg p-0 pr-10 border transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 ${
                  discount < 0
                    ? 'border-rose-500 text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-400/20'
                    : 'border-transparent text-gray-900 dark:text-slate-100 focus:outline-none focus:border-gray-300 dark:focus:border-slate-600 focus:ring-2 focus:ring-gray-300/30'
                }`}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-mono font-medium text-gray-400 dark:text-slate-500 select-none pointer-events-none">
                AFN
              </span>
            </div>
          </div>
        </div>

        {/* GROUP 2: The Bill - Total Payable with mt-2, separator, increased font size */}
        <div className="pt-2 mt-2 border-t border-gray-200/80 dark:border-slate-700/80 flex items-center justify-between h-9">
          <span className="text-sm font-bold text-gray-900 dark:text-slate-100">
            {t('pos.totalPayable')}
          </span>
          <div className="flex items-baseline justify-end font-mono">
            <span className="text-2xl font-black font-mono text-gray-900 dark:text-slate-100 tracking-tight">
              {formatNumber(displayTotal)}
            </span>
            <span className="text-gray-400 dark:text-slate-500 font-mono text-xs font-semibold select-none pointer-events-none">&nbsp;AFN</span>
          </div>
        </div>

        {/* Subtle Divider Line */}
        <div className="border-t border-gray-200/80 dark:border-slate-700/80" />

        {/* GROUP 3: The Payment - Cash Paid row with integrated Exact button */}
        <div className="space-y-1.5">
          {/* Single Row: [Label: Cash Paid] [Input Field] [Exact Button] */}
          <div className="flex items-center justify-between gap-1.5 h-8">
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400 shrink-0">
              {isCard ? t('pos.cardCharge') : t('pos.cashPaid')}
            </span>

            <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
              <div className="relative flex-1 max-w-[125px] h-7.5">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={isCard ? displayTotal : (displayPaid > 0 ? displayPaid : '')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                    onChangeCashPaid(Math.max(0, val))
                  }}
                  disabled={isCard || isCheckoutComplete}
                  placeholder={String(displayTotal || 0)}
                  className={`w-full h-full text-end text-xs font-mono font-bold rounded-lg p-0 pr-9 border transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:text-gray-500 ${
                    isExact
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200'
                      : 'bg-[#F3F4F6] dark:bg-slate-800 hover:bg-[#E5E7EB]/70 dark:hover:bg-slate-700/70 focus:bg-white dark:focus:bg-slate-900 text-gray-900 dark:text-slate-100 border-transparent focus:border-[#4A7C6F] dark:focus:border-[#5A8F7B] focus:outline-none focus:ring-2 focus:ring-[#4A7C6F]/20'
                  }`}
                />
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[11px] font-mono font-medium text-gray-400 dark:text-slate-500 select-none pointer-events-none">
                  AFN
                </span>
              </div>

              {!isCard && displayTotal > 0 && !isCheckoutComplete && (
                <button
                  type="button"
                  onClick={() => onChangeCashPaid(isExact ? 0 : displayTotal)}
                  className={`h-7.5 px-2 rounded-full text-[11px] font-semibold transition-all border cursor-pointer active:scale-95 shadow-2xs flex items-center gap-1 shrink-0 ${
                    isExact
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                      : 'bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/70'
                  }`}
                  title={isExact ? 'Exact settlement filled (Click to clear)' : 'Fill exact settlement total'}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isExact ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                  <span>Exact (تکمیل)</span>
                </button>
              )}
            </div>
          </div>

          {/* Change Due / Status Banner (Only appears when relevant per prompt.md) */}
          {isCheckoutComplete ? (
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-[7px] border bg-[#F0F5F3] dark:bg-emerald-950/30 border-[#059669]/30 text-[#059669] dark:text-emerald-400 shadow-2xs">
              <span className="text-xs font-bold flex items-center gap-1.5 text-[#059669] dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] dark:text-emerald-400 shrink-0" />
                {t('pos.checkedOut')}
              </span>
              {completedInvoiceNo && (
                <span className="font-mono font-bold text-xs text-[#059669] dark:text-emerald-400 bg-white dark:bg-slate-900 border border-[#059669]/30 px-1.5 py-0.5 rounded-[4px] shadow-2xs">
                  {completedInvoiceNo}
                </span>
              )}
            </div>
          ) : isCredit ? (
            selectedCustomerId ? (
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-[7px] border bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-950 dark:text-amber-200 shadow-2xs">
                <div>
                  <span className="text-xs font-bold block text-amber-950 dark:text-amber-200">
                    {selectedCustomer ? `+${formatNumber(displayTotal)} AFN ${t('pos.addedToDebt')}` : t('pos.recordedAsCredit')}
                  </span>
                  <span className="text-[10px] text-amber-800 dark:text-amber-300 font-medium block mt-0.5">
                    {selectedCustomer?.name}: Prior Debt {formatNumber(selectedCustomer?.balance || 0)} AFN ➔ New Debt: <strong className="font-mono font-bold text-amber-950 dark:text-amber-100">{formatNumber((selectedCustomer?.balance || 0) + displayTotal)} AFN</strong>
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-[7px] border bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200 shadow-2xs">
                <span className="text-xs font-bold flex items-center gap-1.5 text-rose-900 dark:text-rose-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                  {t('pos.selectCustomer')}
                </span>
                <span className="text-[10px] bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 px-1.5 py-0.5 rounded font-mono font-bold text-rose-600 dark:text-rose-400">
                  {t('pos.credit')}
                </span>
              </div>
            )
          ) : change > 0 ? (
            /* Change Due in Green */
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-[7px] border bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-200 shadow-2xs">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-[#059669] text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-2xs">
                  ✓
                </div>
                <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 block leading-tight">
                  {t('pos.returnChange')} (Change Due)
                </span>
              </div>
              <div className="flex items-center justify-end font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded-[5px] border border-emerald-300 dark:border-emerald-800/80 shadow-2xs">
                <span className="font-mono font-black text-sm text-emerald-800 dark:text-emerald-400">
                  +{formatNumber(change)}
                </span>
                <span className="text-gray-400 dark:text-slate-500 font-mono text-xs select-none pointer-events-none">&nbsp;AFN</span>
              </div>
            </div>
          ) : hasPartialCash ? (
            /* Remaining Due in Red */
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-[7px] border bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/80 text-rose-950 dark:text-rose-200 shadow-2xs">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="text-xs font-bold text-rose-950 dark:text-rose-200 leading-tight">
                  {t('pos.cashShortage')} (Remaining Due)
                </span>
              </div>
              <div className="flex items-center justify-end font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded-[5px] border border-rose-200 dark:border-rose-800/80 shadow-2xs">
                <span className="font-mono font-black text-xs text-rose-700 dark:text-rose-400">
                  -{formatNumber(shortage)}
                </span>
                <span className="text-gray-400 dark:text-slate-500 font-mono text-xs select-none pointer-events-none">&nbsp;AFN</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default SettlementPanel
