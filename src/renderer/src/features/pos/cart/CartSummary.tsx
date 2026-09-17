import { useTranslation } from 'react-i18next'
import { CreditCard } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { formatCurrency } from '../../../core/utils/formatters'

interface CartSummaryProps {
  subtotal: number
  discount: number
  total: number
  itemCount: number
  onDiscountChange: (val: number) => void
  onCheckout: () => void
}

/**
 * CartSummary: Sleek invoice totals footer with discount input and charge button.
 */
export function CartSummary({
  subtotal,
  discount,
  total,
  itemCount,
  onDiscountChange,
  onCheckout,
}: CartSummaryProps) {
  const { t } = useTranslation()

  return (
    <div className="p-3 border-t border-gray-100 bg-gray-50/40 flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{t('pos.subtotal')}</span>
        <span className="font-mono">{formatCurrency(subtotal)}</span>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{t('pos.discount')}</span>
        <input
          type="number"
          value={discount || ''}
          onChange={(e) => onDiscountChange(Math.max(0, parseFloat(e.target.value) || 0))}
          placeholder="0"
          className="w-20 h-6 px-1.5 text-end font-mono text-xs rounded-[5px] border border-gray-200 bg-white focus:outline-none focus:border-gray-400"
        />
      </div>

      <div className="flex items-center justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
        <span>{t('pos.payableTotal')}</span>
        <span className="font-mono text-emerald-700">{formatCurrency(total)}</span>
      </div>

      <Button
        variant="primary"
        disabled={itemCount === 0}
        onClick={onCheckout}
        icon={<CreditCard className="w-3.5 h-3.5" />}
        className="w-full h-9 mt-1 text-xs"
      >
        {t('pos.chargePrint')}
      </Button>
    </div>
  )
}
