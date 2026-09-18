import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export interface PageHeaderProps {
  title: string
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  action?: ReactNode
  className?: string
}

/**
 * PageHeader: Unified, standardized header for all core views.
 * Enforces identical container height, typography, icon styling, and action button alignment.
 */
export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'text-emerald-600',
  iconBg = 'bg-emerald-50 border-emerald-100/80',
  action,
  className = '',
}: PageHeaderProps) {
  return (
    <div
      className={`flex items-center justify-between min-h-[52px] pb-3 border-b border-gray-200/60 shrink-0 select-none ${className}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 shadow-xs ${iconBg}`}
        >
          <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-800 tracking-tight leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5 leading-none">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {action && (
        <div className="flex items-center gap-2 shrink-0">
          {action}
        </div>
      )}
    </div>
  )
}

export default PageHeader
