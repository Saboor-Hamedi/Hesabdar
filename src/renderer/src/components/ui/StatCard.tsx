import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export type StatCardColor = 'emerald' | 'blue' | 'amber' | 'purple' | 'rose' | 'gray'

export interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: StatCardColor
  tag?: {
    text: string
    color?: StatCardColor
  }
  subtitle?: string
  trend?: {
    value: number
    isPositive?: boolean
    label?: string
  }
  action?: ReactNode
  className?: string
}

const COLOR_MAP: Record<
  StatCardColor,
  {
    icon: string
    iconBg: string
    tagBg: string
    tagText: string
    tagBorder: string
  }
> = {
  emerald: {
    icon: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-100 dark:border-emerald-800/50',
    tagBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    tagText: 'text-emerald-700 dark:text-emerald-300',
    tagBorder: 'border-emerald-200/60 dark:border-emerald-800/50',
  },
  blue: {
    icon: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-100 dark:border-blue-800/50',
    tagBg: 'bg-blue-50 dark:bg-blue-950/40',
    tagText: 'text-blue-700 dark:text-blue-300',
    tagBorder: 'border-blue-200/60 dark:border-blue-800/50',
  },
  amber: {
    icon: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-100 dark:border-amber-800/50',
    tagBg: 'bg-amber-50 dark:bg-amber-950/40',
    tagText: 'text-amber-800 dark:text-amber-300',
    tagBorder: 'border-amber-200/60 dark:border-amber-800/50',
  },
  purple: {
    icon: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-50 dark:bg-purple-950/50 border-purple-100 dark:border-purple-800/50',
    tagBg: 'bg-purple-50 dark:bg-purple-950/40',
    tagText: 'text-purple-700 dark:text-purple-300',
    tagBorder: 'border-purple-200/60 dark:border-purple-800/50',
  },
  rose: {
    icon: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-50 dark:bg-rose-950/50 border-rose-100 dark:border-rose-800/50',
    tagBg: 'bg-rose-50 dark:bg-rose-950/40',
    tagText: 'text-rose-700 dark:text-rose-300',
    tagBorder: 'border-rose-200/60 dark:border-rose-800/50',
  },
  gray: {
    icon: 'text-gray-600 dark:text-slate-400',
    iconBg: 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700',
    tagBg: 'bg-gray-50 dark:bg-slate-800',
    tagText: 'text-gray-600 dark:text-slate-300',
    tagBorder: 'border-gray-200/60 dark:border-slate-700',
  },
}

/**
 * StatCard: Standardized KPI metric card across all modules.
 * Ensures pixel-perfect consistency in height, padding, typography, and icon layout.
 */
export function StatCard({
  title,
  value,
  icon: Icon,
  color = 'emerald',
  tag,
  subtitle,
  trend,
  action,
  className = '',
}: StatCardProps) {
  const theme = COLOR_MAP[color]
  const tagTheme = tag?.color ? COLOR_MAP[tag.color] : theme

  return (
    <div
      className={`w-full h-full min-h-[102px] bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:shadow-sm flex flex-col justify-between select-none ${className}`}
    >
      {/* Top Row: Label and Icon */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider truncate">
          {title}
        </span>
        <div
          className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${theme.iconBg}`}
        >
          <Icon className={`w-3.5 h-3.5 ${theme.icon}`} />
        </div>
      </div>

      {/* Middle Row: Large Monospace Value */}
      <div className="my-1 flex items-baseline justify-between gap-2">
        <span className="text-xl sm:text-2xl font-bold font-mono text-gray-900 dark:text-slate-100 tracking-tight truncate">
          {value}
        </span>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {/* Bottom Row: Tag Badge, Trend, or Subtitle */}
      <div className="flex items-center justify-between gap-2 text-[10px] min-h-[18px]">
        {tag ? (
          <span
            className={`px-2 py-0.5 rounded-[5px] font-medium border truncate ${tagTheme.tagBg} ${tagTheme.tagText} ${tagTheme.tagBorder}`}
          >
            {tag.text}
          </span>
        ) : subtitle ? (
          <span className="text-gray-400 dark:text-slate-400 truncate">{subtitle}</span>
        ) : (
          <span />
        )}

        {trend && (
          <span
            className={`font-semibold shrink-0 ${
              trend.isPositive ?? trend.value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {trend.value >= 0 ? '+' : ''}
            {trend.value}% {trend.label || ''}
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * StatsGrid: Reusable responsive grid container for stat cards.
 * Enforces standardized column distribution and gaps across all tabs.
 */
export function StatsGrid({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`grid grid-cols-2 lg:grid-cols-4 gap-3.5 shrink-0 ${className}`}
    >
      {children}
    </div>
  )
}

export default StatCard
