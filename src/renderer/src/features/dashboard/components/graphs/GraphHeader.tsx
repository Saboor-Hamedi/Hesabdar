import { useTranslation } from 'react-i18next'
import type { GraphPeriod } from '../../../../core/types'

export interface GraphHeaderProps {
  period: GraphPeriod
  onChangePeriod: (period: GraphPeriod) => void
  title?: string
}

/**
 * Header toolbar for graph views with period switcher and legend.
 * Uses small buttons with slight hover and 5px border radius.
 */
export function GraphHeader({ period, onChangePeriod, title }: GraphHeaderProps) {
  const { t } = useTranslation()

  const periods: { id: GraphPeriod; label: string }[] = [
    { id: 'daily', label: t('graphs.daily') },
    { id: 'weekly', label: t('graphs.weekly') },
    { id: 'monthly', label: t('graphs.monthly') },
    { id: 'yearly', label: t('graphs.yearly') },
  ]

  const displayTitle = title || t('graphs.salesPerformance')

  return (
    <div className="flex items-center justify-between gap-3 mb-2">
      {/* Title & Legend */}
      <div className="flex items-center gap-3">
        <h4 className="text-xs font-bold text-gray-900">{displayTitle}</h4>
        <div className="flex items-center gap-3 text-[11px] text-gray-500 select-none">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-[3px] bg-[#2D7A66]" />
            {t('graphs.revenue')}
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-[3px] bg-[#D97706]" />
            {t('graphs.profit')}
          </span>
        </div>
      </div>

      {/* Period Toggle Group: buttons with 6px radius */}
      <div className="flex items-center p-0.5 bg-gray-100 rounded-[8px] border border-gray-200/70">
        {periods.map(({ id, label }) => {
          const isActive = period === id
          return (
            <button
              key={id}
              onClick={() => onChangePeriod(id)}
              className={`
                h-6.5 px-2.5 text-[11px] font-semibold rounded-[6px] transition-all duration-150
                focus:outline-none focus:ring-0 cursor-pointer
                ${
                  isActive
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50'
                }
              `}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
