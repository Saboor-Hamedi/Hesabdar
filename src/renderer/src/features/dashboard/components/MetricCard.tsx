import { type ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

export interface MetricCardProps {
  title: string
  value: string
  subtitle?: string
  trendPercentage?: number
  icon: ReactNode
  className?: string
}

/**
 * MetricCard: Compact KPI Metric Card designed to optimize vertical screen space in Dashboard.
 */
export function MetricCard({
  title,
  value,
  subtitle,
  trendPercentage,
  icon,
  className = '',
}: MetricCardProps) {
  const isPositive = trendPercentage != null && trendPercentage >= 0

  return (
    <div
      className={`w-full h-full min-h-[64px] bg-white border border-gray-200/80 rounded-xl p-2.5 shadow-xs hover:shadow-sm transition-all duration-150 flex flex-col justify-between select-none ${className}`}
    >
      {/* Top Row: Label and Icon */}
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider truncate">
          {title}
        </span>
        <div className="w-5.5 h-5.5 rounded-md border border-gray-100 bg-gray-50 flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>

      {/* Middle Row: Large Monospace Value */}
      <div className="my-0.5 flex items-baseline justify-between gap-2">
        <span className="text-base sm:text-lg font-bold font-mono text-gray-900 tracking-tight truncate">
          {value}
        </span>
      </div>

      {/* Bottom Row: Subtitle and Trend Pill */}
      <div className="flex items-center justify-between gap-1.5 text-[9.5px] min-h-[16px]">
        {subtitle ? (
          <span className="text-gray-400 truncate leading-none">{subtitle}</span>
        ) : (
          <span />
        )}

        {trendPercentage != null && (
          <span
            className={`inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded-[4px] border shrink-0 text-[9px] ${
              isPositive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                : 'bg-rose-50 text-rose-700 border-rose-200/60'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-2.5 h-2.5 text-emerald-600" />
            ) : (
              <TrendingDown className="w-2.5 h-2.5 text-rose-600" />
            )}
            <span>{Math.abs(trendPercentage)}%</span>
          </span>
        )}
      </div>
    </div>
  )
}

export default MetricCard
