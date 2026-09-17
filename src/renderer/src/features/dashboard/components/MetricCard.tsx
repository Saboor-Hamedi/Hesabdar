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
 * Sleek Metric Card with 5px border radius, subtle border, and trend indicator.
 */
export function MetricCard({ title, value, subtitle, trendPercentage, icon }: MetricCardProps) {
  const isPositive = trendPercentage != null && trendPercentage >= 0

  return (
    <div className="bg-white border border-gray-200/90 rounded-[5px] p-3 flex flex-col justify-between select-none">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-medium text-gray-500">{title}</span>
        <div className="p-1.5 rounded-[5px] bg-gray-50 text-gray-600">
          {icon}
        </div>
      </div>

      <div className="flex items-baseline justify-between mt-0.5">
        <span className="text-base font-bold text-gray-900 font-mono tracking-tight">{value}</span>
        {trendPercentage != null && (
          <span
            className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-[5px] ${
              isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}
          >
            {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
            {Math.abs(trendPercentage)}%
          </span>
        )}
      </div>

      {subtitle && <p className="text-[10px] text-gray-400 mt-1">{subtitle}</p>}
    </div>
  )
}
