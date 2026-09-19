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
    // Style configurations for each visual variant adhering to Calm Technology
    const variantStyles: Record<ButtonVariant, string> = {
      // Primary Sage Green (#5A8F7B)
      primary:
        'bg-[#5A8F7B] text-white hover:bg-[#4A7C6F] active:bg-[#3D665B] shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-transparent',
      // Secondary soft gray
      secondary:
        'bg-[#F3F4F6] dark:bg-slate-800 text-[#1F2937] dark:text-slate-100 hover:bg-[#E5E7EB] dark:hover:bg-slate-700 border border-transparent active:bg-[#D1D5DB] dark:active:bg-slate-600',
      // Outline clean border
      outline:
        'bg-[#FAFAFA] dark:bg-slate-800 text-[#1F2937] dark:text-slate-100 hover:bg-[#F3F4F6] dark:hover:bg-slate-700 border border-gray-200/80 dark:border-slate-700 active:bg-gray-100 dark:active:bg-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.03)]',
      // Danger muted red
      danger:
        'bg-rose-600 text-white hover:bg-rose-700 border border-transparent active:bg-rose-800 shadow-[0_1px_2px_rgba(0,0,0,0.05)]',
      // Ghost transparent
      ghost:
        'bg-transparent text-[#6B7280] dark:text-slate-400 hover:text-[#1F2937] dark:hover:text-slate-100 hover:bg-gray-100/80 dark:hover:bg-slate-800 border border-transparent',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center justify-center gap-2
          h-9 px-4 text-xs font-medium rounded-[10px] whitespace-nowrap
          select-none cursor-pointer transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-[#5A8F7B]/20
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
