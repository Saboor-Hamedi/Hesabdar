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
      className={`w-full h-full min-h-[64px] bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-xl p-2.5 shadow-xs select-none ${className}`}
    >
      {/* Top Row: Label and Icon */}
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider truncate">
          {title}
        </span>
        <div className="w-5.5 h-5.5 rounded-md border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/80 flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>

      {/* Middle Row: Large Monospace Value */}
      <div className="my-0.5 flex items-baseline justify-between gap-2">
        <span className="text-base sm:text-lg font-bold font-mono text-gray-900 dark:text-slate-100 tracking-tight truncate">
          {value}
        </span>
      </div>

      {/* Bottom Row: Subtitle and Trend Pill */}
      <div className="flex items-center justify-between gap-1.5 text-[9.5px] min-h-[16px]">
        {subtitle ? (
          <span className="text-gray-400 dark:text-slate-400 truncate leading-none">{subtitle}</span>
        ) : (
          <span />
        )}

        {trendPercentage != null && (
          <span
            className={`inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded-[4px] border shrink-0 text-[9px] ${
              isPositive
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/50'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/50'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <TrendingDown className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400" />
            )}
            <span>{Math.abs(trendPercentage)}%</span>
          </span>
        )}
      </div>
    </div>
  )
}

export default MetricCard
