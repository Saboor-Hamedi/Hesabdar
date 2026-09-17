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
  containerClassName?: string
}

/**
 * Sleek, compact text input with 5px radius, no focus border/ring, and inline validation messages.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, startIcon, endIcon, containerClassName = '', className = '', ...props }, ref) => {
    return (
      <div className={`flex flex-col gap-1 ${containerClassName}`}>
        {/* Optional input label */}
        {label && (
          <label className="text-[11px] font-medium text-gray-600 tracking-wide select-none">
            {label}
            {props.required && <span className="text-red-500 ms-1">*</span>}
          </label>
        )}

        {/* Input field wrapper */}
        <div className="relative flex items-center">
          {/* Start icon slot */}
          {startIcon && (
            <div className="absolute start-2.5 pointer-events-none text-gray-400">
              {startIcon}
            </div>
          )}

          {/* Actual input element: 5px border radius, no focus ring, slight hover */}
          <input
            ref={ref}
            className={`
              w-full h-8 px-2.5 text-xs rounded-[5px] border transition-colors duration-150
              bg-white text-gray-800 placeholder:text-gray-400
              focus:outline-none focus:ring-0
              ${startIcon ? 'ps-8' : ''}
              ${endIcon ? 'pe-8' : ''}
              ${
                error
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-gray-200 hover:border-gray-300 focus:border-gray-400'
              }
              ${props.disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}
              ${className}
            `}
            {...props}
          />

          {/* End icon slot */}
          {endIcon && (
            <div className="absolute end-2.5 text-gray-400">
              {endIcon}
            </div>
          )}
        </div>

        {/* Validation error or helper text */}
        {error ? (
          <span className="text-[11px] text-red-500 leading-tight">{error}</span>
        ) : helperText ? (
          <span className="text-[11px] text-gray-400 leading-tight">{helperText}</span>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'
