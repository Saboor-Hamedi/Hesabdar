import { useTranslation } from 'react-i18next'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { Customer, PaymentMode } from '../../../core/types'
import { formatCurrency } from '../../../core/utils/formatters'
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
    <div className="bg-white border border-gray-200/90 rounded-[5px] p-2.5 shadow-xs flex flex-col gap-1.5 shrink-0">
      {/* 1. Customer Search & Payment Method Selector */}
      <div className="flex items-center gap-1.5">
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
          className="h-7.5 px-2 text-xs border border-gray-300 rounded-[5px] bg-white text-gray-800 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer shrink-0"
        >
          <option value="cash">{t('pos.cash')}</option>
          <option value="credit">{t('pos.credit')}</option>
          <option value="card">{t('pos.card')}</option>
        </select>
      </div>

      {/* 2. Compact Financial Breakdown */}
      <div className="space-y-1 bg-gray-50/80 p-2 rounded-[5px] border border-gray-200/80 text-xs">
        {/* Row 1: Subtotal */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-500 font-medium">{t('pos.subtotal')}</span>
          <span className="font-mono font-semibold text-gray-800 text-[11px]">
            {formatCurrency(displaySubtotal)}
          </span>
        </div>

        {/* Row 2: Discount Input */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-gray-600 font-medium">{t('pos.discount')}</span>
          <div className="w-32 h-6.5 flex items-center rounded-[4px] border border-gray-300 bg-white px-2 focus-within:border-emerald-500">
            <input
              type="number"
              step="any"
              min="0"
              value={displayDiscount || ''}
              onChange={(e) => onChangeDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder="0"
              disabled={isCheckoutComplete}
              className="w-full text-end text-xs font-mono font-bold text-red-600 bg-transparent focus:outline-none disabled:opacity-50"
            />
            <span className="text-[9px] text-gray-400 font-mono ms-1 select-none">
              AFN
            </span>
          </div>
        </div>

        {/* Row 3: Total Payable */}
        <div className="flex items-center justify-between pt-1.5 pb-0.5 border-t border-gray-200">
          <span className="text-xs font-black text-gray-900">{t('pos.totalPayable')}</span>
          <span className="font-mono font-black text-sm text-emerald-700">
            {formatCurrency(displayTotal)} AFN
          </span>
        </div>

        {/* Row 4: Cash Paid Input & Exact Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gray-900">
              {isCard ? t('pos.cardCharge') : t('pos.cashPaid')}
            </span>
            {!isCard && displayTotal > 0 && !isCheckoutComplete && (
              <button
                type="button"
                onClick={() => onChangeCashPaid(displayTotal)}
                className="h-5 px-1.5 bg-emerald-100 hover:bg-emerald-200 active:scale-95 text-emerald-800 rounded-[3px] text-[10px] font-black transition-colors border border-emerald-300 cursor-pointer"
                title="Fill exact total amount"
              >
                {t('pos.exact')}
              </button>
            )}
          </div>
          <div className="w-34 h-8 flex items-center rounded-[4px] border border-gray-300 bg-white px-2 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 shadow-2xs">
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
              className="w-full text-end text-sm font-mono font-black text-gray-950 bg-transparent focus:outline-none disabled:text-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-[10px] text-gray-400 font-mono font-bold ms-1 select-none">
              AFN
            </span>
          </div>
        </div>

        {/* Row 5: Status Banner (Change, Shortage Alert, Debt, or Checked Out) */}
        {isCheckoutComplete ? (
          <div className="flex items-center justify-between px-3 py-2 rounded-[6px] border-2 bg-emerald-50 border-emerald-400 text-emerald-950 shadow-xs">
            <span className="text-xs font-black flex items-center gap-1.5 text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {t('pos.checkedOut')}
            </span>
            {completedInvoiceNo && (
              <span className="font-mono font-black text-xs text-emerald-800 bg-white border border-emerald-300 px-2 py-0.5 rounded shadow-2xs">
                {completedInvoiceNo}
              </span>
            )}
          </div>
        ) : displayTotal === 0 ? (
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-[4px] border bg-gray-100/90 border-gray-200 text-gray-600">
            <span className="text-[11px] font-medium">{t('pos.totalPayable')}</span>
            <span className="font-mono font-bold text-xs">0 AFN</span>
          </div>
        ) : isCredit ? (
          selectedCustomerId ? (
            <div className="flex items-center justify-between px-3 py-2 rounded-[6px] border-2 bg-amber-50 border-amber-300 text-amber-950 shadow-xs">
              <div>
                <span className="text-xs font-bold block text-amber-950">
                  {selectedCustomer ? `+${formatCurrency(displayTotal)} AFN ${t('pos.addedToDebt')}` : t('pos.recordedAsCredit')}
                </span>
                <span className="text-[10px] text-amber-800 font-medium block mt-0.5">
                  {selectedCustomer?.name}: Prior Debt {formatCurrency(selectedCustomer?.balance || 0)} ➔ New Debt: <strong className="font-mono font-bold text-amber-950">{formatCurrency((selectedCustomer?.balance || 0) + displayTotal)} AFN</strong>
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between px-3 py-2 rounded-[6px] border-2 bg-rose-50 border-rose-300 text-rose-800 shadow-xs">
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
          <div className="flex items-center justify-between px-3 py-2 rounded-[6px] border-2 bg-gradient-to-r from-emerald-50 to-emerald-100/70 border-emerald-400 text-emerald-950 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                ✓
              </div>
              <div>
                <span className="text-xs font-black text-emerald-950 block leading-tight">
                  {t('pos.returnChange')}
                </span>
                <span className="text-[10px] text-emerald-700 font-medium">Customer cash balance</span>
              </div>
            </div>
            <span className="font-mono font-black text-sm text-emerald-800 bg-white px-2.5 py-1 rounded-[5px] border border-emerald-300 shadow-2xs">
              +{formatCurrency(change)} AFN
            </span>
          </div>
        ) : hasPartialCash ? (
          <div className="flex items-center justify-between px-3 py-2 rounded-[6px] border-2 bg-red-50 border-red-300 text-red-950 shadow-xs">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <div>
                <span className="text-xs font-black text-red-900 block leading-tight">{t('pos.cashShortage')}</span>
                <span className="text-[10px] text-red-600 font-medium">Underpaid amount</span>
              </div>
            </div>
            <span className="font-mono font-black text-xs text-red-700 bg-white px-2 py-0.5 rounded-[5px] border border-red-200 shadow-2xs">
              -{formatCurrency(shortage)} AFN
            </span>
          </div>
        ) : isExact ? (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-[5px] border border-emerald-300 bg-emerald-50/80 text-emerald-900">
            <span className="text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {t('pos.exactSettlement')}
            </span>
            <span className="font-mono font-black text-xs text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
              0 AFN
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-[4px] border bg-gray-100/90 border-gray-200 text-gray-600">
            <span className="text-[11px] font-medium">{t('pos.totalPayable')}</span>
            <span className="font-mono font-bold text-xs">{formatCurrency(displayTotal)} AFN</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default SettlementPanel
