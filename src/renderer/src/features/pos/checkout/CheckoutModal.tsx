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
      title={t('pos.checkoutTitle')}
      subtitle={`${t('pos.totalDue')} ${formatCurrency(total)}`}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col gap-3">
        {/* Invoice Line Items Summary */}
        <div className="max-h-32 overflow-y-auto border border-gray-100 rounded-[5px] divide-y divide-gray-100">
          {cart.map((it) => (
            <div key={it.product_id} className="p-2 flex justify-between items-center text-xs">
              <span className="font-medium text-gray-700">{it.product_name}</span>
              <span className="font-mono text-gray-500">
                {it.qty} {it.unit} × {formatCurrency(it.unit_price)} ={' '}
                <strong className="text-gray-800">{formatCurrency(it.line_total)}</strong>
              </span>
            </div>
          ))}
        </div>

        {/* Total Payable Banner */}
        <div className="flex items-center justify-between p-2.5 rounded-[5px] bg-gray-50 border border-gray-100">
          <span className="text-xs text-gray-600">{t('pos.totalDue')}</span>
          <span className="text-base font-bold font-mono text-emerald-700">{formatCurrency(total)}</span>
        </div>

        {/* Payment Method Selection */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-medium text-gray-600">{t('pos.selectPayment')}</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onPaymentModeChange('cash')}
              className={`p-2 rounded-[5px] border text-xs font-semibold transition-colors ${
                paymentMode === 'cash'
                  ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 shadow-2xs'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('pos.cash')}
            </button>
            <button
              type="button"
              onClick={() => onPaymentModeChange('credit')}
              className={`p-2 rounded-[5px] border text-xs font-semibold transition-colors ${
                paymentMode === 'credit'
                  ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 shadow-2xs'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('pos.credit')}
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
          <div className="flex flex-col gap-1.5 p-2.5 rounded-[5px] bg-amber-50/50 border border-amber-200">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-amber-900">
                {t('pos.selectCustomer')} *
              </label>
              <button
                type="button"
                onClick={onOpenCustomerModal}
                className="text-[11px] text-emerald-700 hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                {t('customers.addCustomer')}
              </button>
            </div>

            <select
              value={selectedCustomerId || ''}
              onChange={(e) => onSelectCustomer(e.target.value ? Number(e.target.value) : null)}
              className="h-8 px-2 text-xs rounded-[5px] border border-gray-200 bg-white text-gray-800 focus:outline-none"
            >
              <option value="">{t('pos.chooseCustomer')}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ''} — Debt: {formatCurrency(c.balance || 0)}
                </option>
              ))}
            </select>

            {!selectedCustomerId && (
              <p className="text-[10px] text-amber-700">
                {t('pos.customerRequired')}
              </p>
            )}
          </div>
        )}

        {/* Confirmation Button */}
        <Button
          variant="primary"
          onClick={onConfirmPayment}
          isLoading={submitting}
          disabled={paymentMode === 'credit' && !selectedCustomerId}
          className="w-full h-9 mt-1 text-xs"
        >
          {t('pos.confirmPayment')}
        </Button>
      </div>
    </Modal>
  )
}
