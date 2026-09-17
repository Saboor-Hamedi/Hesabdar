import { useTranslation } from 'react-i18next'
import { Users, Wallet, AlertCircle } from 'lucide-react'
import type { Customer } from '../../../core/types'
import { Card } from '../../../components/ui/Card'
import { formatCurrency, formatNumber } from '../../../core/utils/formatters'

interface CustomerMetricsProps {
  customers: Customer[]
}

/**
 * CustomerMetrics: Summary cards for customer accounts and total debt receivables.
 */
export function CustomerMetrics({ customers }: CustomerMetricsProps) {
  const { t } = useTranslation()

  const totalCount = customers.length
  const totalDebt = customers.reduce((sum, c) => sum + (c.balance || 0), 0)
  const debtorsCount = customers.filter((c) => (c.balance || 0) > 0).length

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Card>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-medium">{t('customers.title')}</span>
          <Users className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-base font-bold font-mono text-gray-900">{formatNumber(totalCount)}</span>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-[5px] font-medium">
            {t('customers.activeAccounts')}
          </span>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-medium">{t('customers.balance')}</span>
          <Wallet className="w-4 h-4 text-amber-600" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-base font-bold font-mono text-amber-800">{formatCurrency(totalDebt)}</span>
          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-[5px] font-medium">
            {t('customers.totalReceivables')}
          </span>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-medium">{t('customers.debtorAccounts')}</span>
          <AlertCircle className="w-4 h-4 text-rose-500" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-base font-bold font-mono text-rose-700">{formatNumber(debtorsCount)}</span>
          <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-[5px] font-medium">
            {t('customers.withDebt')}
          </span>
        </div>
      </Card>
    </div>
  )
}
