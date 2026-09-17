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
  children: ReactNode
  maxWidth?: string
  className?: string
  bodyClassName?: string
  style?: React.CSSProperties
  zIndex?: number
}

/**
 * Accessible dialog modal with 5px border radius, backdrop blur, and ESC dismiss.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
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

  const sizingClass = maxWidth || (hasExplicitWidth ? '' : 'max-w-md')

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 print:static print:p-0 print:block"
      style={{ zIndex }}
    >
      {/* Dimmed backdrop with slight blur */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity no-print"
        onClick={onClose}
      />

      {/* Modal Dialog Box: 5px radius, sleek shadow */}
      <div
        style={style}
        className={`
          relative z-10 w-full ${sizingClass} bg-white rounded-[5px]
          border border-gray-200/90 shadow-xl overflow-hidden
          animate-in fade-in zoom-in-95 duration-150
          print:border-none print:shadow-none print:overflow-visible print:w-auto print:max-w-none print:static
          ${className}
        `}
      >
        {/* Header with Title and Close Button */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50 shrink-0 no-print">
          <div>
            <h2 className="text-xs font-semibold text-gray-800">{title}</h2>
            {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-[5px] hover:bg-gray-100 transition-colors focus:outline-none cursor-pointer"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className={`p-4 max-h-[85vh] overflow-y-auto print:p-0 print:max-h-none print:overflow-visible ${bodyClassName}`}>
          {children}
        </div>
      </div>
    </div>
  )
}
