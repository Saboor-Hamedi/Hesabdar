import { useTranslation } from 'react-i18next'
import { formatCurrency, formatNumber } from '../../../../core/utils/formatters'
import type { TimeSeriesPoint } from '../../../../core/types'

/**
 * Props for GraphTooltip component
 */
export interface GraphTooltipProps {
  point: TimeSeriesPoint | null
  x: number
  y: number
}

/**
 * Floating tooltip for SVG graph points with 5px radius and currency formatting.
 */
export function GraphTooltip({ point, x, y }: GraphTooltipProps) {
  const { t } = useTranslation()
  if (!point) return null

  return (
    <div
      className="absolute pointer-events-none z-20 bg-gray-900/90 text-white text-[11px] p-2 rounded-[5px] shadow-lg backdrop-blur-sm border border-gray-700/50 -translate-x-1/2 -translate-y-full mb-2"
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      <div className="font-semibold text-gray-200 border-b border-gray-700/60 pb-1 mb-1">
        {point.label} <span className="text-gray-400 text-[10px]">({point.date})</span>
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {t('graphs.revenue')}:
          </span>
          <span className="font-mono font-medium">{formatCurrency(point.revenue)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-amber-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            {t('graphs.profit')}:
          </span>
          <span className="font-mono font-medium">{formatCurrency(point.profit)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            {t('graphs.orders')}:
          </span>
          <span className="font-mono font-medium">{formatNumber(point.orders)}</span>
        </div>
      </div>
    </div>
  )
}
