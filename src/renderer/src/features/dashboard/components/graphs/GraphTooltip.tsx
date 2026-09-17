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
      className="absolute pointer-events-none z-20 bg-gray-900/95 text-white text-[11px] p-2.5 rounded-[8px] shadow-xl backdrop-blur-md border border-gray-700/60 -translate-x-1/2 -translate-y-full mb-2"
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      <div className="font-bold text-gray-100 border-b border-gray-700/60 pb-1 mb-1.5 flex items-center justify-between gap-3">
        <span>{point.label}</span>
        <span className="text-gray-400 font-mono text-[10px]">{point.date}</span>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {t('graphs.revenue')}:
          </span>
          <span className="font-mono font-bold text-emerald-300">{formatCurrency(point.revenue)} AFN</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-amber-400 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {t('graphs.profit')}:
          </span>
          <span className="font-mono font-bold text-amber-300">{formatCurrency(point.profit)} AFN</span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-0.5 border-t border-gray-800">
          <span className="text-gray-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-500" />
            {t('graphs.orders')}:
          </span>
          <span className="font-mono font-semibold text-gray-200">{formatNumber(point.orders)}</span>
        </div>
      </div>
    </div>
  )
}
