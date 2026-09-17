import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

/**
 * Modal component props
 */
export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  badge?: ReactNode
  children: ReactNode
  maxWidth?: string
  className?: string
  bodyClassName?: string
  style?: React.CSSProperties
  zIndex?: number
}

/**
 * Modern modal dialog conforming to Global Modal Design System:
 * - 16px border radius (rounded-2xl)
 * - Soft deep shadow (0 25px 50px -12px rgba(0,0,0,0.15))
 * - Backdrop overlay rgba(0,0,0,0.4) with blur
 * - Clean header without colored backgrounds, H2 title (20-24px), 13px subtitle
 * - Top-right badge slot and minimalist X close icon
 * - Standardized 32px padding (px-8)
 */
export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  maxWidth,
  className = '',
  bodyClassName = '',
  style,
  zIndex = 50,
}: ModalProps) {
  // Listen to Escape key to dismiss modal
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Determine width constraint: if style/className has width or custom maxWidth, don't force max-w-md
  const hasExplicitWidth =
    Boolean(style?.width) ||
    Boolean(maxWidth) ||
    className.includes('w-[') ||
    className.includes('max-w-[') ||
    className.includes('max-w-lg') ||
    className.includes('max-w-xl') ||
    className.includes('max-w-2xl') ||
    className.includes('max-w-3xl') ||
    className.includes('max-w-4xl')

  const sizingClass = maxWidth || (hasExplicitWidth ? '' : 'max-w-lg')

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 print:static print:p-0 print:block"
      style={{ zIndex }}
    >
      {/* Dimmed backdrop overlay: rgba(0,0,0,0.4) with slight blur */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity no-print"
        onClick={onClose}
      />

      {/* Modal Dialog Box: 16px radius, soft deep shadow */}
      <div
        style={style}
        className={`
          relative z-10 w-full ${sizingClass} bg-white rounded-2xl
          border border-gray-100 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden
          animate-in fade-in zoom-in-95 duration-150
          print:border-none print:shadow-none print:overflow-visible print:w-auto print:max-w-none print:static
          ${className}
        `}
      >
        {/* Header with Title, optional top-right Badge, and Minimalist Close Button */}
        <div className="flex items-start justify-between px-8 pt-7 pb-4 bg-white shrink-0 no-print">
          <div className="flex-1 pr-4">
            <h2 className="text-xl font-bold text-[#1F2937] tracking-tight leading-snug">{title}</h2>
            {subtitle && <p className="text-[13px] text-[#6B7280] font-normal mt-1 leading-normal">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3 shrink-0 pt-0.5">
            {badge && <div className="shrink-0">{badge}</div>}
            <button
              onClick={onClose}
              className="text-[#9CA3AF] hover:text-[#111827] p-1.5 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body with standardized padding */}
        <div className={`px-8 pb-8 pt-2 max-h-[85vh] overflow-y-auto print:p-0 print:max-h-none print:overflow-visible ${bodyClassName}`}>
          {children}
        </div>
      </div>
    </div>
  )
}
