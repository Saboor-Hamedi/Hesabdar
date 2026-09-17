import { useTranslation } from 'react-i18next'
import { Receipt, Banknote, CreditCard, ShoppingBag } from 'lucide-react'
import type { Sale } from '../../../core/types'
import { Card } from '../../../components/ui/Card'
import { formatCurrency, formatNumber } from '../../../core/utils/formatters'

interface SoldMetricsProps {
  sales: Sale[]
}

/**
 * SoldMetrics: Top KPI summary cards for completed sales transactions.
 */
export function SoldMetrics({ sales }: SoldMetricsProps) {
  const { t } = useTranslation()

  const totalInvoices = sales.length
  const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0)
  const cashRevenue = sales
    .filter((s) => s.payment_mode === 'cash')
    .reduce((sum, s) => sum + (s.total || 0), 0)
  const creditRevenue = sales
    .filter((s) => s.payment_mode === 'credit')
    .reduce((sum, s) => sum + (s.total || 0), 0)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-medium">{t('sold.totalSales')}</span>
          <Receipt className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-base font-bold font-mono text-gray-900">{formatNumber(totalInvoices)}</span>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-[5px] font-medium">
            {t('sold.invoices')}
          </span>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-medium">{t('sold.totalRevenue')}</span>
          <ShoppingBag className="w-4 h-4 text-blue-600" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-base font-bold font-mono text-gray-900">{formatCurrency(totalRevenue)}</span>
          <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-[5px] font-medium">
            {t('sold.grossTotal')}
          </span>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-medium">{t('sold.cashSales')}</span>
          <Banknote className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-base font-bold font-mono text-emerald-800">{formatCurrency(cashRevenue)}</span>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-[5px] font-medium">
            {t('sold.paidCash')}
          </span>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-medium">{t('sold.creditSales')}</span>
          <CreditCard className="w-4 h-4 text-amber-600" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-base font-bold font-mono text-amber-800">{formatCurrency(creditRevenue)}</span>
          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-[5px] font-medium">
            {t('sold.receivables')}
          </span>
        </div>
      </Card>
    </div>
  )
}
