import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

/**
 * Button component variants
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'

/**
 * Button component props
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  icon?: ReactNode
  isLoading?: boolean
}

/**
 * Sleek, compact button with 5px border radius, slight hover, and no focus outline.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', icon, isLoading = false, className = '', disabled, ...props }, ref) => {
    // Style configurations for each visual variant
    const variantStyles: Record<ButtonVariant, string> = {
      // Primary brand green
      primary:
        'bg-[#10b981] text-white hover:bg-[#059669] border border-transparent active:bg-[#047857]',
      // Secondary soft gray
      secondary:
        'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 active:bg-gray-300',
      // Outline clean border
      outline:
        'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 active:bg-gray-100',
      // Danger red
      danger:
        'bg-red-500 text-white hover:bg-red-600 border border-transparent active:bg-red-700',
      // Ghost transparent
      ghost:
        'bg-transparent text-gray-600 hover:bg-gray-100 border border-transparent',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center justify-center gap-1.5
          h-8 px-3 text-xs font-medium rounded-[5px] whitespace-nowrap
          select-none cursor-pointer transition-colors duration-150
          focus:outline-none focus:ring-0 focus:border-inherit
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
