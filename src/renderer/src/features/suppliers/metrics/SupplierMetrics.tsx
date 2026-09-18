import { useTranslation } from 'react-i18next'
import { Truck, Wallet, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { Supplier } from '../../../core/types'
import { StatCard, StatsGrid } from '../../../components/ui/StatCard'
import { formatCurrency, formatNumber } from '../../../core/utils/formatters'

interface SupplierMetricsProps {
  suppliers: Supplier[]
}

/**
 * SupplierMetrics: Standardized summary cards for wholesale vendors and accounts payable.
 */
export function SupplierMetrics({ suppliers }: SupplierMetricsProps) {
  const { t } = useTranslation()

  const totalVendors = suppliers.length
  const totalPayable = suppliers.reduce((sum, s) => sum + (s.balance || 0), 0)
  const payableCount = suppliers.filter((s) => (s.balance || 0) > 0).length
  const settledCount = Math.max(0, totalVendors - payableCount)

  return (
    <StatsGrid>
      <StatCard
        title={t('suppliers.title')}
        value={formatNumber(totalVendors)}
        icon={Truck}
        color="emerald"
        tag={{ text: t('suppliers.activeVendors'), color: 'emerald' }}
      />

      <StatCard
        title={t('suppliers.balance')}
        value={formatCurrency(totalPayable)}
        icon={Wallet}
        color="amber"
        tag={{ text: t('suppliers.accountsPayable'), color: 'amber' }}
      />

      <StatCard
        title={t('suppliers.pendingPayments')}
        value={formatNumber(payableCount)}
        icon={AlertCircle}
        color="rose"
        tag={{ text: t('suppliers.suppliersToSettle'), color: 'rose' }}
      />

      <StatCard
        title={t('suppliers.settled', 'Settled')}
        value={formatNumber(settledCount)}
        icon={CheckCircle2}
        color="blue"
        tag={{ text: t('suppliers.zeroBalance', 'Zero Balance'), color: 'blue' }}
      />
    </StatsGrid>
  )
}

export default SupplierMetrics
