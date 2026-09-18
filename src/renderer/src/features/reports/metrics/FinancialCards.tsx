import { useTranslation } from 'react-i18next'
import { DollarSign, ShoppingCart, TrendingUp, Wallet, Truck } from 'lucide-react'
import { StatCard } from '../../../components/ui/StatCard'
import { formatCurrency } from '../../../core/utils/formatters'

interface FinancialCardsProps {
  grossSales: number
  cogs: number
  netProfit: number
  totalCustomerDebt: number
  totalSupplierPayable: number
  salesCount: number
  customersCount: number
  suppliersCount: number
}

/**
 * FinancialCards: Standardized ledger KPI summary cards for business performance.
 */
export function FinancialCards({
  grossSales,
  cogs,
  netProfit,
  totalCustomerDebt,
  totalSupplierPayable,
  salesCount,
  customersCount,
  suppliersCount,
}: FinancialCardsProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 shrink-0">
      <StatCard
        title={t('reports.grossSales')}
        value={formatCurrency(grossSales)}
        icon={DollarSign}
        color="emerald"
        tag={{ text: `${salesCount} invoices`, color: 'emerald' }}
      />

      <StatCard
        title={t('reports.cogs')}
        value={formatCurrency(cogs)}
        icon={ShoppingCart}
        color="blue"
        tag={{ text: 'Cost basis', color: 'blue' }}
      />

      <StatCard
        title={t('reports.netProfitMargin')}
        value={formatCurrency(netProfit)}
        icon={TrendingUp}
        color={netProfit >= 0 ? 'emerald' : 'rose'}
        tag={{
          text: grossSales > 0 ? `${Math.round((netProfit / grossSales) * 100)}% margin` : '0%',
          color: netProfit >= 0 ? 'emerald' : 'rose',
        }}
      />

      <StatCard
        title={t('reports.customerCredit')}
        value={formatCurrency(totalCustomerDebt)}
        icon={Wallet}
        color="amber"
        tag={{
          text: totalCustomerDebt === 0 ? 'Optimal Flow' : `${customersCount} accounts`,
          color: totalCustomerDebt === 0 ? 'emerald' : 'amber',
        }}
      />

      <StatCard
        title={t('reports.payableSuppliers')}
        value={formatCurrency(totalSupplierPayable)}
        icon={Truck}
        color="purple"
        tag={{ text: `${suppliersCount} vendors`, color: 'purple' }}
      />
    </div>
  )
}

export default FinancialCards
