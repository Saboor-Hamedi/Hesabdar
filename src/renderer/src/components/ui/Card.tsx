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
    <div className={`bg-[#FAFAFA] border border-gray-200/60 rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden ${className}`}>
      {/* Optional Card Header */}
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/50 bg-white/70">
          <div>
            {title && <h3 className="text-xs font-semibold text-[#1F2937] tracking-wide">{title}</h3>}
            {subtitle && <p className="text-[11px] text-[#6B7280] mt-0.5">{subtitle}</p>}
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
