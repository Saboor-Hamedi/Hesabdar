import { type ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

export interface MetricCardProps {
  title: string
  value: string
  subtitle?: string
  trendPercentage?: number
  icon: ReactNode
}

/**
 * Sleek Metric Card with 8px border radius, calm borders, and clear trend indicator.
 */
export function MetricCard({ title, value, subtitle, trendPercentage, icon }: MetricCardProps) {
  const isPositive = trendPercentage != null && trendPercentage >= 0

  return (
    <div className="bg-white border border-gray-200/80 rounded-[8px] p-3.5 flex flex-col justify-between shadow-xs select-none">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-gray-500">{title}</span>
        <div className="p-1.5 rounded-[6px] bg-gray-50 text-gray-700 border border-gray-100">
          {icon}
        </div>
      </div>

      <div className="flex items-baseline justify-between mt-1 gap-2 flex-wrap">
        <span className="text-lg font-bold text-gray-900 font-mono tracking-tight">{value}</span>
        {trendPercentage != null && (
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-[6px] border ${
              isPositive
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/70'
                : 'bg-rose-50 text-rose-700 border-rose-200/70'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : <TrendingDown className="w-3 h-3 text-rose-600" />}
            {Math.abs(trendPercentage)}%
          </span>
        )}
      </div>

      {subtitle && <p className="text-[11px] text-gray-400 mt-1 font-medium">{subtitle}</p>}
    </div>
  )
}
