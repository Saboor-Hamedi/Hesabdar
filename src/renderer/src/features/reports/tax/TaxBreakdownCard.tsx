import { useTranslation } from 'react-i18next'
import { Calendar, ShieldAlert } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { formatCurrency } from '../../../core/utils/formatters'

interface TaxBreakdownCardProps {
  grossSales: number
  taxRate?: number
}

/**
 * TaxBreakdownCard: Afghan BRT (Business Receipts Tax) calculation and fiscal ledger summary.
 */
export function TaxBreakdownCard({ grossSales, taxRate = 4 }: TaxBreakdownCardProps) {
  const { t } = useTranslation()
  const calculatedTax = Math.round(grossSales * (taxRate / 100))

  return (
    <Card
      title={t('reports.monthlyBreakdown')}
      subtitle={t('reports.taxSubtitle')}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-100 rounded-[5px]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[5px] bg-blue-50 text-blue-600 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-800">
                {t('reports.quarterlyDeclaration')}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-[3px] bg-blue-100 text-blue-800 font-mono font-medium">
                BRT {taxRate}%
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Standard Afghan business receipt tax estimated from gross sales turnover
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-end">
            <span className="text-[10px] text-gray-400 block">Payable Tax</span>
            <span className="font-mono text-sm font-bold text-gray-900">
              {formatCurrency(calculatedTax)}
            </span>
          </div>
          <div className="hidden sm:flex items-center text-gray-400 text-xs gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[10px]">Compliant</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
