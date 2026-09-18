import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { Check, X } from 'lucide-react'

/**
 * Input component props with live validation message and inner icon support
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
  isValid?: boolean
  showValidationMark?: boolean
}

/**
 * Helper to live-validate input values based on type and content.
 */
function getValidationStatus(
  value: unknown,
  type?: string,
  label?: string,
  placeholder?: string,
  required?: boolean,
  explicitError?: string,
  explicitValid?: boolean
): { isValid: boolean; isInvalid: boolean } | null {
  // If error is explicitly passed, it's invalid
  if (explicitError) return { isValid: false, isInvalid: true }
  // If isValid is explicitly passed, obey it
  if (explicitValid !== undefined) return { isValid: explicitValid, isInvalid: !explicitValid }

  if (value === undefined || value === null) return null
  const str = String(value).trim()
  if (str.length === 0) return null

  const labelLower = (label || '').toLowerCase()
  const placeholderLower = (placeholder || '').toLowerCase()
  const isPhone =
    type === 'tel' ||
    labelLower.includes('phone') ||
    placeholderLower.includes('07') ||
    placeholderLower.includes('+93')

  // Live Phone Validation (Afghan & International)
  if (isPhone) {
    // If user types letters in a phone input, that's invalid
    if (/[a-zA-Z]/.test(str)) {
      return { isValid: false, isInvalid: true }
    }
    // Remove formatting characters (spaces, dashes, parentheses, dots)
    const clean = str.replace(/[\s\-\(\)\.]/g, '')

    // 1. Afghan mobile starting with 07 (e.g. 07XXXXXXXX) -> MUST BE EXACTLY 10 DIGITS
    if (/^07/.test(clean)) {
      const digits = clean.replace(/\D/g, '')
      if (digits.length === 10) {
        return { isValid: true, isInvalid: false }
      }
      if (digits.length > 10) {
        // Exceeded 10 digits: immediately invalid so user knows it's too long
        return { isValid: false, isInvalid: true }
      }
      // While typing (1 to 9 digits), neutral (neither valid nor invalid)
      return null
    }

    // 2. Afghan mobile starting with 7 without 0 (e.g. 7XXXXXXXX) -> MUST BE EXACTLY 9 DIGITS
    if (/^7[0-9]/.test(clean)) {
      const digits = clean.replace(/\D/g, '')
      if (digits.length === 9) {
        return { isValid: true, isInvalid: false }
      }
      if (digits.length > 9) {
        return { isValid: false, isInvalid: true }
      }
      return null
    }

    // 3. Afghan mobile with country code (+937... or 00937...)
    if (/^(\+93|0093)7/.test(clean)) {
      const digits = clean.replace(/\D/g, '')
      const expected = clean.startsWith('+') ? 11 : 13
      if (digits.length === expected) {
        return { isValid: true, isInvalid: false }
      }
      if (digits.length > expected) {
        return { isValid: false, isInvalid: true }
      }
      return null
    }

    // 4. Afghan landline (020... or +9320...)
    if (/^(020|\+9320)/.test(clean)) {
      const digits = clean.replace(/\D/g, '')
      const expected = clean.startsWith('+') ? 11 : 9
      if (digits.length >= expected && digits.length <= expected + 1) {
        return { isValid: true, isInvalid: false }
      }
      if (digits.length > expected + 1) {
        return { isValid: false, isInvalid: true }
      }
      return null
    }

    // 5. International number with + (e.g. +62895365910015)
    if (clean.startsWith('+')) {
      const digits = clean.replace(/\D/g, '')
      if (digits.length >= 8 && digits.length <= 15) {
        return { isValid: true, isInvalid: false }
      }
      if (digits.length > 15) {
        return { isValid: false, isInvalid: true }
      }
      return null
    }

    // 6. Generic numbers without specific prefix
    const digits = clean.replace(/\D/g, '')
    if (digits.length === 10) {
      return { isValid: true, isInvalid: false }
    }
    if (digits.length > 15) {
      return { isValid: false, isInvalid: true }
    }

    return null
  }

  // Live Email Validation
  if (type === 'email' || labelLower.includes('email')) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
    if (emailRegex.test(str)) {
      return { isValid: true, isInvalid: false }
    }
    // While typing email, don't show invalid unless there's invalid whitespace or multiple @
    if (str.includes(' ') || (str.match(/@/g) || []).length > 1) {
      return { isValid: false, isInvalid: true }
    }
    return null
  }

  // Live Number Validation
  if (type === 'number') {
    const num = Number(str)
    const valid = !isNaN(num) && str.length > 0
    return valid ? { isValid: true, isInvalid: false } : null
  }

  // Required text validation
  if (required && str.length >= 2) {
    return { isValid: true, isInvalid: false }
  }

  return null
}

/**
 * Modern form input supporting Light Fill style, inline currency suffix,
 * 8px radius, subtle sage focus ring, and uppercase tracking-wide labels.
 * Features live inner validation indicators (thick green checkmark when valid, red X when invalid).
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
      isValid: explicitValid,
      showValidationMark = true,
      placeholder,
      value,
      ...props
    },
    ref
  ) => {
    const isNumber = type === 'number'

    // Compute live validation status
    const validation = showValidationMark
      ? getValidationStatus(
          value,
          type,
          label,
          placeholder,
          props.required,
          error,
          explicitValid
        )
      : null

    const hasValidationIcon = validation !== null && !endIcon

    return (
      <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
        {/* Uppercase 11px tracking-wide label */}
        {label && (
          <label className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B7280] select-none flex items-center justify-between">
            <span>
              {label}
              {props.required && !label.includes('*') && (
                <span className="text-rose-500 font-bold ms-1 text-xs">*</span>
              )}
            </span>
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
            value={value}
            placeholder={placeholder}
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
              ${hasValidationIcon || endIcon || suffix ? (suffix ? 'pe-18' : 'pe-8') : ''}
              ${
                validation?.isValid
                  ? 'border-emerald-500/60 focus:border-emerald-600 focus:ring-emerald-500/20'
                  : ''
              }
              ${
                validation?.isInvalid
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-400/20'
                  : ''
              }
              ${props.disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-transparent' : ''}
              ${className}
            `}
            {...props}
          />

          {/* Static currency or text suffix */}
          {suffix && (
            <span
              className={`absolute text-xs font-mono font-medium text-[#6B7280] pointer-events-none select-none ${
                hasValidationIcon ? 'end-8' : 'end-3'
              }`}
            >
              {suffix}
            </span>
          )}

          {/* Live Inner Validation Icon (Right Side) — Small, crisp, no circular background */}
          {hasValidationIcon && (
            <div className="absolute end-2.5 flex items-center pointer-events-none select-none">
              {validation.isValid ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
              ) : validation.isInvalid ? (
                <X className="w-3.5 h-3.5 text-rose-500 stroke-[2.5]" />
              ) : null}
            </div>
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

export default Input
