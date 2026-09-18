import { useTranslation } from 'react-i18next'
import { Receipt, Banknote, CreditCard, ShoppingBag } from 'lucide-react'
import type { Sale } from '../../../core/types'
import { StatCard, StatsGrid } from '../../../components/ui/StatCard'
import { formatCurrency, formatNumber } from '../../../core/utils/formatters'

interface SoldMetricsProps {
  sales: Sale[]
}

/**
 * SoldMetrics: Standardized KPI summary cards for completed sales transactions.
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
    <StatsGrid>
      <StatCard
        title={t('sold.totalSales')}
        value={formatNumber(totalInvoices)}
        icon={Receipt}
        color="emerald"
        tag={{ text: t('sold.invoices'), color: 'emerald' }}
      />

      <StatCard
        title={t('sold.totalRevenue')}
        value={formatCurrency(totalRevenue)}
        icon={ShoppingBag}
        color="blue"
        tag={{ text: t('sold.grossTotal'), color: 'blue' }}
      />

      <StatCard
        title={t('sold.cashSales')}
        value={formatCurrency(cashRevenue)}
        icon={Banknote}
        color="emerald"
        tag={{ text: t('sold.paidCash'), color: 'emerald' }}
      />

      <StatCard
        title={t('sold.creditSales')}
        value={formatCurrency(creditRevenue)}
        icon={CreditCard}
        color="amber"
        tag={{ text: t('sold.receivables'), color: 'amber' }}
      />
    </StatsGrid>
  )
}

export default SoldMetrics
