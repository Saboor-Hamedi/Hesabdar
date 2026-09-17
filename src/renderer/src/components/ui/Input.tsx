import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'

/**
 * Input component props with validation message and icon support
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  startIcon?: ReactNode
  endIcon?: ReactNode
  suffix?: string
  variant?: 'light' | 'outline'
  containerClassName?: string
}

/**
 * Modern form input supporting Light Fill style, inline currency suffix,
 * 8px radius, subtle sage focus ring, and uppercase tracking-wide labels.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      startIcon,
      endIcon,
      suffix,
      variant = 'light',
      containerClassName = '',
      className = '',
      type,
      ...props
    },
    ref
  ) => {
    const isNumber = type === 'number'

    return (
      <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
        {/* Uppercase 11px tracking-wide label */}
        {label && (
          <label className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B7280] select-none">
            {label}
            {props.required && <span className="text-gray-400 font-normal ms-1 lowercase">(required)</span>}
          </label>
        )}

        {/* Input field wrapper */}
        <div className="relative flex items-center">
          {/* Start icon slot */}
          {startIcon && (
            <div className="absolute start-3 pointer-events-none text-gray-400">
              {startIcon}
            </div>
          )}

          {/* Actual input element */}
          <input
            ref={ref}
            type={type}
            className={`
              w-full h-9 px-3 text-xs rounded-lg transition-all duration-150
              ${isNumber ? 'font-mono' : ''}
              ${
                variant === 'light'
                  ? 'bg-[#F9FAFB] hover:bg-[#F3F4F6] text-[#1F2937] placeholder:text-gray-400 border border-transparent focus:border-[#5A8F7B]/40 focus:bg-white'
                  : 'bg-white text-[#1F2937] placeholder:text-gray-400 border border-gray-200 hover:border-gray-300 focus:border-[#5A8F7B]/50'
              }
              focus:outline-none focus:ring-2 focus:ring-[#5A8F7B]/20
              ${startIcon ? 'ps-8' : ''}
              ${endIcon || suffix ? 'pe-14' : ''}
              ${
                error
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-400/20 bg-rose-50/20'
                  : ''
              }
              ${props.disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-transparent' : ''}
              ${className}
            `}
            {...props}
          />

          {/* Static currency or text suffix */}
          {suffix && (
            <span className="absolute end-3 text-xs font-mono font-medium text-[#6B7280] pointer-events-none select-none">
              {suffix}
            </span>
          )}

          {/* End icon slot */}
          {endIcon && !suffix && (
            <div className="absolute end-3 text-gray-400">
              {endIcon}
            </div>
          )}
        </div>

        {/* Validation error or helper text */}
        {error ? (
          <span className="text-[11px] text-red-500 leading-tight">{error}</span>
        ) : helperText ? (
          <span className="text-[11px] text-[#6B7280] leading-tight">{helperText}</span>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'
