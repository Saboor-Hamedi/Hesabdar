import { type ReactNode } from 'react'

/**
 * Props for Card container component
 */
export interface CardProps {
  title?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}

/**
 * Reusable sleek Card with 5px border radius, subtle border, and optional header.
 */
export function Card({ title, subtitle, action, children, className = '', contentClassName = '' }: CardProps) {
  return (
    <div className={`bg-[#FAFAFA] dark:bg-slate-900 border border-gray-200/60 dark:border-slate-800 rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden ${className}`}>
      {/* Optional Card Header */}
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/50 dark:border-slate-800 bg-white/70 dark:bg-slate-800/60">
          <div>
            {title && <h3 className="text-xs font-semibold text-[#1F2937] dark:text-slate-100 tracking-wide">{title}</h3>}
            {subtitle && <p className="text-[11px] text-[#6B7280] dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      {/* Card Content */}
      <div className={`p-4 ${contentClassName}`}>
        {children}
      </div>
    </div>
  )
}
