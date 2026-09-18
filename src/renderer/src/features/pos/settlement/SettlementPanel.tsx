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
    <div className="bg-white border border-gray-200/80 rounded-[8px] p-2.5 shadow-xs flex flex-col gap-1.5 shrink-0">
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
          className="h-7.5 px-2 text-xs border border-gray-200 rounded-[6px] bg-gray-50 text-gray-800 font-semibold focus:outline-none focus:border-[#4A7C6F] cursor-pointer shrink-0"
        >
          <option value="cash">{t('pos.cash')}</option>
          <option value="credit">{t('pos.credit')}</option>
          <option value="card">{t('pos.card')}</option>
        </select>
      </div>

      {/* 2. Financial Stack per suggestion.md */}
      <div className="space-y-2 bg-gray-50/70 p-2.5 rounded-xl border border-gray-200/70 text-xs">
        {/* GROUP 1: The Calculation (Static) */}
        <div className="space-y-1.5">
          {/* Subtotal row */}
          <div className="flex items-center justify-between h-6.5">
            <span className="text-xs font-medium text-gray-500">{t('pos.subtotal')}</span>
            <div className="flex items-center justify-end font-mono">
              <span className="font-mono font-semibold text-gray-800 text-xs">
                {formatNumber(displaySubtotal)}
              </span>
              <span className="text-gray-400 font-mono text-xs select-none pointer-events-none">&nbsp;AFN</span>
            </div>
          </div>

          {/* Discount row: uniform h-8 container */}
          <div className="flex items-center justify-between h-8 gap-2.5">
            <span className="text-xs font-medium text-gray-500">{t('pos.discount')}</span>
            <div className="relative w-38 h-7.5">
              <input
                type="number"
                step="any"
                min="0"
                value={displayDiscount || ''}
                onChange={(e) => onChangeDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                disabled={isCheckoutComplete}
                className={`w-full h-full bg-[#F3F4F6] hover:bg-[#E5E7EB]/70 focus:bg-white text-end text-xs font-mono font-medium rounded-lg p-0 pr-11 border transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 ${
                  discount < 0
                    ? 'border-rose-500 text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-400/20'
                    : 'border-transparent text-gray-900 focus:outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-300/30'
                }`}
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono font-medium text-gray-400 select-none pointer-events-none">
                AFN
              </span>
            </div>
          </div>
        </div>

        {/* Subtle Divider Line */}
        <div className="border-t border-gray-200/80" />

        {/* GROUP 2: The Bill (Dynamic Anchor): uniform h-8.5 container */}
        <div className="flex items-center justify-between h-8.5">
          <span className="text-sm font-bold text-gray-900">
            {t('pos.totalPayable')}
          </span>
          <div className="flex items-baseline justify-end font-mono">
            <span className="text-xl font-bold font-mono text-gray-900 tracking-tight">
              {formatNumber(displayTotal)}
            </span>
            <span className="text-gray-400 font-mono text-xs font-medium select-none pointer-events-none">&nbsp;AFN</span>
          </div>
        </div>

        {/* Subtle Divider Line */}
        <div className="border-t border-gray-200/80" />

        {/* GROUP 3: The Payment (Interactive): uniform h-8 container */}
        <div className="space-y-1.5">
          {/* Cash Paid Row */}
          <div className="flex items-center justify-between h-8 gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-gray-500">
                {isCard ? t('pos.cardCharge') : t('pos.cashPaid')}
              </span>
              {!isCard && displayTotal > 0 && !isCheckoutComplete && (
                <button
                  type="button"
                  onClick={() => onChangeCashPaid(displayTotal)}
                  className="h-5 px-1.5 bg-[#5A8F7B]/10 hover:bg-[#5A8F7B]/20 active:scale-95 text-[#4A7C6F] rounded-[4px] text-[10px] font-semibold transition-colors border border-[#5A8F7B]/30 cursor-pointer"
                  title="Fill exact total amount"
                >
                  {t('pos.exact')}
                </button>
              )}
            </div>
            <div className="relative w-38 h-7.5">
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
                className="w-full h-full bg-[#F3F4F6] hover:bg-[#E5E7EB]/70 focus:bg-white text-end text-xs font-mono font-bold text-gray-900 rounded-lg p-0 pr-11 border border-transparent focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:text-gray-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono font-medium text-gray-400 select-none pointer-events-none">
                AFN
              </span>
            </div>
          </div>

          {/* Change Due / Status Banner (Only appears when relevant per suggestion.md) */}
          {isCheckoutComplete ? (
            <div className="flex items-center justify-between px-3 py-2.5 rounded-[8px] border bg-[#F0F5F3] border-[#059669]/30 text-[#059669] shadow-2xs">
              <span className="text-xs font-bold flex items-center gap-1.5 text-[#059669]">
                <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                {t('pos.checkedOut')}
              </span>
              {completedInvoiceNo && (
                <span className="font-mono font-bold text-xs text-[#059669] bg-white border border-[#059669]/30 px-2 py-0.5 rounded-[4px] shadow-2xs">
                  {completedInvoiceNo}
                </span>
              )}
            </div>
          ) : isCredit ? (
            selectedCustomerId ? (
              <div className="flex items-center justify-between px-3 py-2.5 rounded-[8px] border bg-amber-50/90 border-amber-200 text-amber-950 shadow-2xs">
                <div>
                  <span className="text-xs font-bold block text-amber-950">
                    {selectedCustomer ? `+${formatNumber(displayTotal)} AFN ${t('pos.addedToDebt')}` : t('pos.recordedAsCredit')}
                  </span>
                  <span className="text-[10px] text-amber-800 font-medium block mt-0.5">
                    {selectedCustomer?.name}: Prior Debt {formatNumber(selectedCustomer?.balance || 0)} AFN ➔ New Debt: <strong className="font-mono font-bold text-amber-950">{formatNumber((selectedCustomer?.balance || 0) + displayTotal)} AFN</strong>
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between px-3 py-2.5 rounded-[8px] border bg-rose-50/90 border-rose-200 text-rose-800 shadow-2xs">
                <span className="text-xs font-bold flex items-center gap-1.5 text-rose-900">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  {t('pos.selectCustomer')}
                </span>
                <span className="text-[10px] bg-white border border-rose-200 px-1.5 py-0.5 rounded font-mono font-bold text-rose-600">
                  {t('pos.credit')}
                </span>
              </div>
            )
          ) : change > 0 ? (
            /* Change Due in Green */
            <div className="flex items-center justify-between px-3 py-2.5 rounded-[8px] border bg-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#059669] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                  ✓
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-950 block leading-tight">
                    {t('pos.returnChange')} (Change Due)
                  </span>
                  <span className="text-[10px] text-emerald-700 font-medium">Return cash to customer</span>
                </div>
              </div>
              <div className="flex items-center justify-end font-mono bg-white px-2.5 py-0.5 rounded-[6px] border border-emerald-300 shadow-2xs">
                <span className="font-mono font-black text-base text-emerald-800">
                  +{formatNumber(change)}
                </span>
                <span className="text-gray-400 font-mono text-xs select-none pointer-events-none">&nbsp;AFN</span>
              </div>
            </div>
          ) : hasPartialCash ? (
            /* Remaining Due in Red */
            <div className="flex items-center justify-between px-3 py-2.5 rounded-[8px] border bg-rose-50 border-rose-300 text-rose-950 shadow-2xs">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-rose-950 block leading-tight">
                    {t('pos.cashShortage')} (Remaining Due)
                  </span>
                  <span className="text-[10px] text-rose-600 font-medium">Underpaid shortage amount</span>
                </div>
              </div>
              <div className="flex items-center justify-end font-mono bg-white px-2 py-0.5 rounded-[5px] border border-rose-200 shadow-2xs">
                <span className="font-mono font-black text-sm text-rose-700">
                  -{formatNumber(shortage)}
                </span>
                <span className="text-gray-400 font-mono text-xs select-none pointer-events-none">&nbsp;AFN</span>
              </div>
            </div>
          ) : isExact ? (
            /* Exact Settlement */
            <div className="flex items-center justify-between px-3 py-2 rounded-[8px] border border-emerald-300 bg-emerald-50/80 text-emerald-900">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                {t('pos.exactSettlement')}
              </span>
              <span className="font-mono font-bold text-xs text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                0 AFN (Exact)
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default SettlementPanel
