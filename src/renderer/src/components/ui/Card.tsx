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
    <div className={`bg-white border border-gray-200/80 rounded-[5px] overflow-hidden ${className}`}>
      {/* Optional Card Header */}
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50/50">
          <div>
            {title && <h3 className="text-xs font-semibold text-gray-800">{title}</h3>}
            {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      {/* Card Content */}
      <div className={`p-3 ${contentClassName}`}>
        {children}
      </div>
    </div>
  )
}
