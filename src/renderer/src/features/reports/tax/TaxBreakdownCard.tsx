import { useTranslation } from 'react-i18next'
import { Calendar, ShieldCheck } from 'lucide-react'
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-gray-50/80 border border-gray-200/70 rounded-[8px]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[8px] bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Calendar className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-900">
                {t('reports.quarterlyDeclaration')}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-[5px] bg-blue-50 text-blue-700 border border-blue-200 font-mono font-bold">
                BRT {taxRate}%
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Standard Afghan business receipt tax estimated automatically from gross sales turnover ({formatCurrency(grossSales)} AFN)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="text-end">
            <span className="text-[10px] text-gray-500 font-medium block">Estimated Payable Tax</span>
            <span className="font-mono text-base font-bold text-gray-900">
              {formatCurrency(calculatedTax)} AFN
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-[11px] font-bold">Compliant</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
