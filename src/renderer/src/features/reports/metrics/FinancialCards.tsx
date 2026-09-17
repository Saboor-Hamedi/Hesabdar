import { useTranslation } from 'react-i18next'
import { Card } from '../../../components/ui/Card'
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
 * FinancialCards: Sleek ledger KPI summary cards for business performance.
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

  const financialSummary = [
    {
      label: t('reports.grossSales'),
      value: grossSales,
      change: `${salesCount} invoices`,
      positive: true,
    },
    {
      label: t('reports.cogs'),
      value: cogs,
      change: 'Cost basis',
      positive: false,
    },
    {
      label: t('reports.netProfitMargin'),
      value: netProfit,
      change: grossSales > 0 ? `${Math.round((netProfit / grossSales) * 100)}% margin` : '0%',
      positive: netProfit >= 0,
    },
    {
      label: t('reports.customerCredit'),
      value: totalCustomerDebt,
      change: `${customersCount} accounts`,
      positive: true,
    },
    {
      label: t('reports.payableSuppliers'),
      value: totalSupplierPayable,
      change: `${suppliersCount} vendors`,
      positive: false,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
      {financialSummary.map((item, idx) => (
        <Card key={idx}>
          <span className="text-[11px] text-gray-400 font-medium">{item.label}</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-base font-bold font-mono text-gray-900">
              {formatCurrency(item.value)}
            </span>
            <span
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded-[5px] ${
                item.positive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              {item.change}
            </span>
          </div>
        </Card>
      ))}
    </div>
  )
}
