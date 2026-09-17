import { useState, useCallback, useMemo, useEffect } from 'react'
import { Delete, RotateCcw, Calculator, ArrowDownToLine } from 'lucide-react'

interface CalculatorNumpadProps {
  onApplyToPaid?: (val: number) => void
  totalPayable?: number
  resetKey?: number
}

const MAX_DIGITS = 12

/**
 * CalculatorNumpad: High-precision, bulletproof POS Cashier Calculator.
 * - Prevents infinite leading zeros (e.g. "000000")
 * - Strictly enforces max 12 digits to guarantee display never overflows
 * - Dynamic LCD font size scaling
 * - Supports chained operators, operator switching, division by zero guard, and percentage
 */
export function CalculatorNumpad({ onApplyToPaid, totalPayable = 0, resetKey }: CalculatorNumpadProps) {
  const [display, setDisplay] = useState('0')
  const [prevOperand, setPrevOperand] = useState<number | null>(null)
  const [operator, setOperator] = useState<string | null>(null)
  const [isNewNumber, setIsNewNumber] = useState(true)

  // Clear calculator on external reset trigger (e.g. on Checkout)
  useEffect(() => {
    if (resetKey !== undefined && resetKey > 0) {
      setDisplay('0')
      setPrevOperand(null)
      setOperator(null)
      setIsNewNumber(true)
    }
  }, [resetKey])

  // Floating point clean calculation
  const calculate = (a: number, op: string, b: number): number => {
    let result = 0
    switch (op) {
      case '+':
        result = a + b
        break
      case '-':
        result = a - b
        break
      case '×':
      case '*':
        result = a * b
        break
      case '÷':
      case '/':
        result = b !== 0 ? a / b : NaN
        break
      default:
        result = b
    }
    // Round to avoid IEEE 754 precision issues (e.g. 0.1 + 0.2 = 0.30000000000000004)
    return Math.round(result * 1000000) / 1000000
  }

  // Handle number click (0-9, 00)
  const handleDigit = useCallback((digit: string) => {
    setDisplay((prev) => {
      // If we are starting a new number or display is '0' or 'Error'
      if (isNewNumber || prev === '0' || prev === 'Error') {
        setIsNewNumber(false)
        if (digit === '00' || digit === '0') {
          return '0' // Never accumulate multiple leading zeros!
        }
        return digit
      }

      // If user presses '0' or '00' while display is already just '0'
      if (prev === '0') {
        return digit === '00' || digit === '0' ? '0' : digit
      }

      // Enforce max digits limit so display never spills out
      if (prev.replace('.', '').length >= MAX_DIGITS) {
        return prev
      }

      return prev + digit
    })
  }, [isNewNumber])

  // Handle decimal dot
  const handleDot = useCallback(() => {
    setDisplay((prev) => {
      if (isNewNumber || prev === 'Error') {
        setIsNewNumber(false)
        return '0.'
      }
      if (prev.includes('.')) {
        return prev // Prevent duplicate dots
      }
      return prev + '.'
    })
  }, [isNewNumber])

  // Handle operators (+, -, ×, ÷)
  const handleOperator = useCallback((nextOp: string) => {
    const currentVal = parseFloat(display)

    if (isNaN(currentVal) || display === 'Error') {
      return
    }

    if (prevOperand !== null && operator && !isNewNumber) {
      // Perform intermediate calculation
      const res = calculate(prevOperand, operator, currentVal)
      if (isNaN(res) || !isFinite(res)) {
        setDisplay('Error')
        setPrevOperand(null)
        setOperator(null)
        setIsNewNumber(true)
        return
      }
      setDisplay(String(res))
      setPrevOperand(res)
    } else {
      setPrevOperand(currentVal)
    }

    setOperator(nextOp)
    setIsNewNumber(true)
  }, [display, prevOperand, operator, isNewNumber])

  // Handle equals (=)
  const handleEquals = useCallback(() => {
    if (operator === null || prevOperand === null) return

    const currentVal = parseFloat(display)
    if (isNaN(currentVal) || display === 'Error') return

    const res = calculate(prevOperand, operator, currentVal)
    if (isNaN(res) || !isFinite(res)) {
      setDisplay('Error')
    } else {
      setDisplay(String(res))
    }

    setPrevOperand(null)
    setOperator(null)
    setIsNewNumber(true)
  }, [operator, prevOperand, display])

  // Handle clear (C)
  const handleClear = useCallback(() => {
    setDisplay('0')
    setPrevOperand(null)
    setOperator(null)
    setIsNewNumber(true)
  }, [])

  // Backspace
  const handleBackspace = useCallback(() => {
    setDisplay((prev) => {
      if (isNewNumber || prev === 'Error' || prev.length <= 1) {
        setIsNewNumber(true)
        return '0'
      }
      const sliced = prev.slice(0, -1)
      return sliced === '' || sliced === '-' ? '0' : sliced
    })
  }, [isNewNumber])

  // Percentage
  const handlePercent = useCallback(() => {
    const currentVal = parseFloat(display)
    if (isNaN(currentVal) || display === 'Error') return

    if (prevOperand !== null && (operator === '+' || operator === '-')) {
      // e.g. 100 - 20% -> 20% of 100 is 20
      const percentVal = (prevOperand * currentVal) / 100
      setDisplay(String(Math.round(percentVal * 100000) / 100000))
    } else {
      const res = currentVal / 100
      setDisplay(String(Math.round(res * 1000000) / 1000000))
    }
    setIsNewNumber(true)
  }, [display, prevOperand, operator])

  // Dynamic Equation display text
  const equationText = useMemo(() => {
    if (prevOperand !== null && operator) {
      return `${prevOperand} ${operator}`
    }
    return '\u00A0'
  }, [prevOperand, operator])

  // Dynamic font sizing based on length to guarantee zero overflow
  const displayFontSize = useMemo(() => {
    const len = display.length
    if (len > 12) return 'text-lg sm:text-xl'
    if (len > 9) return 'text-xl sm:text-2xl'
    if (len > 6) return 'text-2xl sm:text-3xl'
    return 'text-3xl sm:text-4xl'
  }, [display])

  return (
    <div className="bg-white border border-gray-200/90 rounded-[5px] p-3 shadow-xs flex flex-col gap-2 flex-1 min-h-0">
      {/* 1. Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-1.5 shrink-0">
        <div className="flex items-center gap-1.5 text-gray-700">
          <Calculator className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold">Cashier Calculator</span>
        </div>
        {totalPayable > 0 && (
          <button
            type="button"
            onClick={() => {
              setDisplay(String(totalPayable))
              setPrevOperand(null)
              setOperator(null)
              setIsNewNumber(true)
            }}
            className="text-[11px] text-emerald-700 hover:underline font-mono font-semibold transition-colors cursor-pointer"
            title="Load invoice total into calculator"
          >
            Load Total ({totalPayable.toLocaleString()})
          </button>
        )}
      </div>

      {/* 2. Digital LCD Screen Display (Centered large bold digits, strictly non-overflowing) */}
      <div className="bg-gray-950 text-white rounded-[5px] px-3 py-1.5 flex flex-col items-center justify-center text-center font-mono shadow-inner min-h-[60px] border border-gray-800 shrink-0 overflow-hidden">
        <span className="text-[11px] text-gray-400 truncate w-full h-4 select-none leading-none text-center">
          {equationText}
        </span>
        <div className="w-full overflow-hidden flex items-center justify-center">
          <span
            className={`font-black tracking-wider text-emerald-400 select-all leading-tight text-center truncate max-w-full ${displayFontSize}`}
          >
            {display}
          </span>
        </div>
      </div>

      {/* 3. Button Matrix */}
      <div className="grid grid-cols-4 grid-rows-5 gap-1.5 flex-1 min-h-0 select-none">
        {/* Row 1 */}
        <button
          type="button"
          onClick={handleClear}
          className="h-full min-h-[38px] rounded-[5px] bg-red-50 hover:bg-red-100 active:scale-[0.98] border border-red-200 text-red-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-1 transition-all shadow-2xs cursor-pointer"
          title="Clear"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>C</span>
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          className="h-full min-h-[38px] rounded-[5px] bg-gray-100 hover:bg-gray-200 active:scale-[0.98] border border-gray-200 text-gray-700 font-bold text-xs flex items-center justify-center transition-all shadow-2xs cursor-pointer"
          title="Backspace"
        >
          <Delete className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handlePercent}
          className="h-full min-h-[38px] rounded-[5px] bg-gray-100 hover:bg-gray-200 active:scale-[0.98] border border-gray-200 text-gray-700 font-bold text-base flex items-center justify-center transition-all shadow-2xs cursor-pointer"
        >
          %
        </button>
        <button
          type="button"
          onClick={() => handleOperator('÷')}
          className={`h-full min-h-[38px] rounded-[5px] border active:scale-[0.98] font-black text-lg flex items-center justify-center transition-all shadow-2xs cursor-pointer ${
            operator === '÷'
              ? 'bg-emerald-600 text-white border-emerald-700'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
          }`}
        >
          ÷
        </button>

        {/* Row 2 */}
        <button
          type="button"
          onClick={() => handleDigit('7')}
          className="h-full min-h-[38px] rounded-[5px] bg-white hover:bg-gray-50 active:scale-[0.98] active:bg-gray-100 border border-gray-300 text-gray-900 font-mono font-bold text-base sm:text-lg shadow-2xs transition-all flex items-center justify-center cursor-pointer"
        >
          7
        </button>
        <button
          type="button"
          onClick={() => handleDigit('8')}
          className="h-full min-h-[38px] rounded-[5px] bg-white hover:bg-gray-50 active:scale-[0.98] active:bg-gray-100 border border-gray-300 text-gray-900 font-mono font-bold text-base sm:text-lg shadow-2xs transition-all flex items-center justify-center cursor-pointer"
        >
          8
        </button>
        <button
          type="button"
          onClick={() => handleDigit('9')}
          className="h-full min-h-[38px] rounded-[5px] bg-white hover:bg-gray-50 active:scale-[0.98] active:bg-gray-100 border border-gray-300 text-gray-900 font-mono font-bold text-base sm:text-lg shadow-2xs transition-all flex items-center justify-center cursor-pointer"
        >
          9
        </button>
        <button
          type="button"
          onClick={() => handleOperator('×')}
          className={`h-full min-h-[38px] rounded-[5px] border active:scale-[0.98] font-black text-lg flex items-center justify-center transition-all shadow-2xs cursor-pointer ${
            operator === '×'
              ? 'bg-emerald-600 text-white border-emerald-700'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
          }`}
        >
          ×
        </button>

        {/* Row 3 */}
        <button
          type="button"
          onClick={() => handleDigit('4')}
          className="h-full min-h-[38px] rounded-[5px] bg-white hover:bg-gray-50 active:scale-[0.98] active:bg-gray-100 border border-gray-300 text-gray-900 font-mono font-bold text-base sm:text-lg shadow-2xs transition-all flex items-center justify-center cursor-pointer"
        >
          4
        </button>
        <button
          type="button"
          onClick={() => handleDigit('5')}
          className="h-full min-h-[38px] rounded-[5px] bg-white hover:bg-gray-50 active:scale-[0.98] active:bg-gray-100 border border-gray-300 text-gray-900 font-mono font-bold text-base sm:text-lg shadow-2xs transition-all flex items-center justify-center cursor-pointer"
        >
          5
        </button>
        <button
          type="button"
          onClick={() => handleDigit('6')}
          className="h-full min-h-[38px] rounded-[5px] bg-white hover:bg-gray-50 active:scale-[0.98] active:bg-gray-100 border border-gray-300 text-gray-900 font-mono font-bold text-base sm:text-lg shadow-2xs transition-all flex items-center justify-center cursor-pointer"
        >
          6
        </button>
        <button
          type="button"
          onClick={() => handleOperator('-')}
          className={`h-full min-h-[38px] rounded-[5px] border active:scale-[0.98] font-black text-lg flex items-center justify-center transition-all shadow-2xs cursor-pointer ${
            operator === '-'
              ? 'bg-emerald-600 text-white border-emerald-700'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
          }`}
        >
          -
        </button>

        {/* Row 4 */}
        <button
          type="button"
          onClick={() => handleDigit('1')}
          className="h-full min-h-[38px] rounded-[5px] bg-white hover:bg-gray-50 active:scale-[0.98] active:bg-gray-100 border border-gray-300 text-gray-900 font-mono font-bold text-base sm:text-lg shadow-2xs transition-all flex items-center justify-center cursor-pointer"
        >
          1
        </button>
        <button
          type="button"
          onClick={() => handleDigit('2')}
          className="h-full min-h-[38px] rounded-[5px] bg-white hover:bg-gray-50 active:scale-[0.98] active:bg-gray-100 border border-gray-300 text-gray-900 font-mono font-bold text-base sm:text-lg shadow-2xs transition-all flex items-center justify-center cursor-pointer"
        >
          2
        </button>
        <button
          type="button"
          onClick={() => handleDigit('3')}
          className="h-full min-h-[38px] rounded-[5px] bg-white hover:bg-gray-50 active:scale-[0.98] active:bg-gray-100 border border-gray-300 text-gray-900 font-mono font-bold text-base sm:text-lg shadow-2xs transition-all flex items-center justify-center cursor-pointer"
        >
          3
        </button>
        <button
          type="button"
          onClick={() => handleOperator('+')}
          className={`h-full min-h-[38px] rounded-[5px] border active:scale-[0.98] font-black text-lg flex items-center justify-center transition-all shadow-2xs cursor-pointer ${
            operator === '+'
              ? 'bg-emerald-600 text-white border-emerald-700'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
          }`}
        >
          +
        </button>

        {/* Row 5 */}
        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="h-full min-h-[38px] rounded-[5px] bg-white hover:bg-gray-50 border border-gray-300 text-gray-900 font-mono font-bold text-base sm:text-lg shadow-2xs transition-all flex items-center justify-center cursor-pointer"
        >
          0
        </button>
        <button
          type="button"
          onClick={() => handleDigit('00')}
          className="h-full min-h-[38px] rounded-[5px] bg-white hover:bg-gray-50 border border-gray-300 text-gray-900 font-mono font-bold text-base sm:text-lg shadow-2xs transition-all flex items-center justify-center cursor-pointer"
        >
          00
        </button>
        <button
          type="button"
          onClick={handleDot}
          className="h-full min-h-[38px] rounded-[5px] bg-white hover:bg-gray-50 border border-gray-300 text-gray-900 font-mono font-bold text-base sm:text-lg shadow-2xs transition-all flex items-center justify-center cursor-pointer"
        >
          .
        </button>
        <button
          type="button"
          onClick={handleEquals}
          className="h-full min-h-[38px] rounded-[5px] bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-xl shadow-xs flex items-center justify-center transition-all cursor-pointer"
        >
          =
        </button>
      </div>

      {/* 4. Quick Action Button */}
      {onApplyToPaid && (
        <div className="shrink-0 pt-0.5">
          <button
            type="button"
            onClick={() => {
              const val = parseFloat(display)
              if (!isNaN(val) && val >= 0) {
                onApplyToPaid(val)
              }
            }}
            className="w-full h-8 px-2 bg-emerald-50 hover:bg-emerald-100 active:scale-[0.99] border border-emerald-200 text-emerald-800 rounded-[5px] text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>Apply to Cash Paid</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default CalculatorNumpad
