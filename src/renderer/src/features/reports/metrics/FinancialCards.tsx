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
      tagClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    },
    {
      label: t('reports.cogs'),
      value: cogs,
      change: 'Cost basis',
      tagClass: 'bg-slate-100 text-slate-700 border border-slate-200/60 font-medium',
    },
    {
      label: t('reports.netProfitMargin'),
      value: netProfit,
      change: grossSales > 0 ? `${Math.round((netProfit / grossSales) * 100)}% margin` : '0%',
      tagClass:
        netProfit >= 0
          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-semibold'
          : 'bg-rose-50 text-rose-700 border border-rose-200/60',
    },
    {
      label: t('reports.customerCredit'),
      value: totalCustomerDebt,
      change: totalCustomerDebt === 0 ? 'Optimal Cash Flow' : `${customersCount} accounts`,
      tagClass:
        totalCustomerDebt === 0
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-medium'
          : 'bg-amber-50 text-amber-800 border border-amber-200/60',
    },
    {
      label: t('reports.payableSuppliers'),
      value: totalSupplierPayable,
      change: `${suppliersCount} vendors`,
      tagClass: 'bg-slate-100 text-slate-700 border border-slate-200/60 font-medium',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
      {financialSummary.map((item, idx) => (
        <Card key={idx}>
          <span className="text-xs text-gray-500 font-medium">{item.label}</span>
          <div className="flex items-baseline justify-between mt-2 gap-1.5 flex-wrap">
            <span className="text-lg font-bold font-mono text-gray-900">
              {formatCurrency(item.value)}
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-[6px] ${item.tagClass}`}
            >
              {item.change}
            </span>
          </div>
        </Card>
      ))}
    </div>
  )
}
