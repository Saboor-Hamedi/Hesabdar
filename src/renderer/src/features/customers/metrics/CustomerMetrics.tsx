import { useTranslation } from 'react-i18next'
import { Users, Wallet, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { Customer } from '../../../core/types'
import { StatCard, StatsGrid } from '../../../components/ui/StatCard'
import { formatCurrency, formatNumber } from '../../../core/utils/formatters'

interface CustomerMetricsProps {
  customers: Customer[]
}

/**
 * CustomerMetrics: Standardized summary cards for customer accounts and total debt receivables.
 */
export function CustomerMetrics({ customers }: CustomerMetricsProps) {
  const { t } = useTranslation()

  const totalCount = customers.length
  const totalDebt = customers.reduce((sum, c) => sum + (c.balance || 0), 0)
  const debtorsCount = customers.filter((c) => (c.balance || 0) > 0).length
  const settledCount = Math.max(0, totalCount - debtorsCount)

  return (
    <StatsGrid>
      <StatCard
        title={t('customers.title')}
        value={formatNumber(totalCount)}
        icon={Users}
        color="emerald"
        tag={{ text: t('customers.activeAccounts'), color: 'emerald' }}
      />

      <StatCard
        title={t('customers.balance')}
        value={formatCurrency(totalDebt)}
        icon={Wallet}
        color="amber"
        tag={{ text: t('customers.totalReceivables'), color: 'amber' }}
      />

      <StatCard
        title={t('customers.debtorAccounts')}
        value={formatNumber(debtorsCount)}
        icon={AlertCircle}
        color="rose"
        tag={{ text: t('customers.withDebt'), color: 'rose' }}
      />

      <StatCard
        title={t('customers.goodStanding', 'Good Standing')}
        value={formatNumber(settledCount)}
        icon={CheckCircle2}
        color="blue"
        tag={{ text: t('customers.zeroBalance', 'Zero Balance'), color: 'blue' }}
      />
    </StatsGrid>
  )
}

export default CustomerMetrics
