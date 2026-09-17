import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import type { CartItem, Customer, PaymentMode } from '../../../core/types'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { formatCurrency } from '../../../core/utils/formatters'
import { ChangeCalculator } from './ChangeCalculator'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  total: number
  paymentMode: PaymentMode
  onPaymentModeChange: (mode: PaymentMode) => void
  tenderedCash: number
  onChangeTendered: (val: number) => void
  customers: Customer[]
  selectedCustomerId: number | null
  onSelectCustomer: (id: number | null) => void
  onOpenCustomerModal: () => void
  onConfirmPayment: () => void
  submitting?: boolean
}

/**
 * CheckoutModal: Clean payment modal with payment mode selection, credit customer account assignment, and change calculation.
 */
export function CheckoutModal({
  isOpen,
  onClose,
  cart,
  total,
  paymentMode,
  onPaymentModeChange,
  tenderedCash,
  onChangeTendered,
  customers,
  selectedCustomerId,
  onSelectCustomer,
  onOpenCustomerModal,
  onConfirmPayment,
  submitting = false,
}: CheckoutModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('pos.checkoutTitle', 'Payment Settlement')}
      subtitle={`${t('pos.totalDue', 'Total Due')}: ${formatCurrency(total)}`}
      style={{ width: '520px', maxWidth: '95vw' }}
      bodyClassName="p-8"
    >
      <div className="flex flex-col gap-5">
        {/* Invoice Line Items Summary */}
        <div className="max-h-36 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-100 bg-gray-50/50">
          {cart.map((it) => (
            <div key={it.product_id} className="p-2.5 flex justify-between items-center text-xs">
              <span className="font-medium text-gray-800">{it.product_name}</span>
              <span className="font-mono text-gray-500">
                {it.qty} {it.unit} × {formatCurrency(it.unit_price)} ={' '}
                <strong className="text-gray-900 font-bold">{formatCurrency(it.line_total)}</strong>
              </span>
            </div>
          ))}
        </div>

        {/* Total Payable Banner */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('pos.totalDue', 'Total Payable')}</span>
          <span className="text-xl font-bold font-mono text-gray-950">{formatCurrency(total)}</span>
        </div>

        {/* Payment Method Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B7280] select-none">
            {t('pos.selectPayment', 'Payment Method')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onPaymentModeChange('cash')}
              className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                paymentMode === 'cash'
                  ? 'border-[#5A8F7B] bg-emerald-50/50 text-[#2D7A66] shadow-2xs'
                  : 'border-gray-200 bg-[#F9FAFB] text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t('pos.cash', 'Cash Payment')}
            </button>
            <button
              type="button"
              onClick={() => onPaymentModeChange('credit')}
              className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                paymentMode === 'credit'
                  ? 'border-[#5A8F7B] bg-emerald-50/50 text-[#2D7A66] shadow-2xs'
                  : 'border-gray-200 bg-[#F9FAFB] text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t('pos.credit', 'Customer Credit / Debt')}
            </button>
          </div>
        </div>

        {/* Cash Tendered & Change Return Facility */}
        {paymentMode === 'cash' && (
          <ChangeCalculator
            total={total}
            tenderedCash={tenderedCash}
            onChangeTendered={onChangeTendered}
          />
        )}

        {/* Customer Account Selector for Credit Sales */}
        {paymentMode === 'credit' && (
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-amber-50/60 border border-amber-200/80">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-amber-900">
                {t('pos.selectCustomer', 'Select Debtor Account')}
              </label>
              <button
                type="button"
                onClick={onOpenCustomerModal}
                className="text-[11px] text-[#2D7A66] font-semibold hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                {t('customers.addCustomer', 'New Customer')}
              </button>
            </div>

            <select
              value={selectedCustomerId || ''}
              onChange={(e) => onSelectCustomer(e.target.value ? Number(e.target.value) : null)}
              className="h-9 px-3 text-xs rounded-lg border border-transparent bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5A8F7B]/20"
            >
              <option value="">{t('pos.chooseCustomer', 'Choose customer from registry...')}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ''} — Debt: {formatCurrency(c.balance || 0)}
                </option>
              ))}
            </select>

            {!selectedCustomerId && (
              <p className="text-[11px] text-amber-700 font-medium">
                {t('pos.customerRequired', 'Customer selection is required for credit / debt sales.')}
              </p>
            )}
          </div>
        )}

        {/* Confirmation Footer */}
        <div className="flex items-center justify-end gap-6 pt-4 border-t border-gray-100">
          <Button variant="ghost" type="button" onClick={onClose}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={onConfirmPayment}
            isLoading={submitting}
            disabled={paymentMode === 'credit' && !selectedCustomerId}
          >
            {t('pos.confirmPayment', 'Confirm & Complete Sale')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
