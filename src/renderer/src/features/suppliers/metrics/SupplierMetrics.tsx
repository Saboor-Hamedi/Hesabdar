import { useTranslation } from 'react-i18next'
import { Truck, Wallet, AlertCircle } from 'lucide-react'
import type { Supplier } from '../../../core/types'
import { Card } from '../../../components/ui/Card'
import { formatCurrency, formatNumber } from '../../../core/utils/formatters'

interface SupplierMetricsProps {
  suppliers: Supplier[]
}

/**
 * SupplierMetrics: Summary cards for wholesale vendors and accounts payable.
 */
export function SupplierMetrics({ suppliers }: SupplierMetricsProps) {
  const { t } = useTranslation()

  const totalVendors = suppliers.length
  const totalPayable = suppliers.reduce((sum, s) => sum + (s.balance || 0), 0)
  const payableCount = suppliers.filter((s) => (s.balance || 0) > 0).length

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Card>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-medium">{t('suppliers.title')}</span>
          <Truck className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-base font-bold font-mono text-gray-900">{formatNumber(totalVendors)}</span>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-[5px] font-medium">
            {t('suppliers.activeVendors')}
          </span>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-medium">{t('suppliers.balance')}</span>
          <Wallet className="w-4 h-4 text-amber-600" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-base font-bold font-mono text-amber-800">{formatCurrency(totalPayable)}</span>
          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-[5px] font-medium">
            {t('suppliers.accountsPayable')}
          </span>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-medium">{t('suppliers.pendingPayments')}</span>
          <AlertCircle className="w-4 h-4 text-rose-500" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-base font-bold font-mono text-rose-700">{formatNumber(payableCount)}</span>
          <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-[5px] font-medium">
            {t('suppliers.suppliersToSettle')}
          </span>
        </div>
      </Card>
    </div>
  )
}
