import { useState, useCallback, useMemo, useEffect } from 'react'
import { Delete, Calculator, ArrowDownToLine } from 'lucide-react'

interface CalculatorNumpadProps {
  onApplyToPaid?: (val: number) => void
  totalPayable?: number
  resetKey?: number
}

const MAX_DIGITS = 12

function formatNumberClean(num: number): string {
  if (isNaN(num) || !isFinite(num)) return 'Error'
  const rounded = Math.round(num * 1000000) / 1000000
  return String(rounded)
}

/**
 * CalculatorNumpad: High-precision, bulletproof POS Cashier Calculator.
 * - Solid right-aligned LCD digits (numbers never jump horizontally)
 * - Retains full equation on top line (e.g. "8 + 6 =" and doesn't disappear into empty space)
 * - Clean "C" clear button without awkward icon clutter
 * - Guards against leading zero buildup and IEEE 754 precision errors
 * - Dynamic font sizing to ensure numbers never overflow
 */
export function CalculatorNumpad({ onApplyToPaid, totalPayable = 0, resetKey }: CalculatorNumpadProps) {
  const [display, setDisplay] = useState('0')
  const [expression, setExpression] = useState('')
  const [prevOperand, setPrevOperand] = useState<number | null>(null)
  const [operator, setOperator] = useState<string | null>(null)
  const [isNewNumber, setIsNewNumber] = useState(true)
  const [hasCalculated, setHasCalculated] = useState(false)

  // Clear calculator on external reset trigger (e.g. on Checkout)
  useEffect(() => {
    if (resetKey !== undefined && resetKey > 0) {
      setDisplay('0')
      setExpression('')
      setPrevOperand(null)
      setOperator(null)
      setIsNewNumber(true)
      setHasCalculated(false)
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
    return Math.round(result * 1000000) / 1000000
  }

  // Handle number click (0-9, 00)
  const handleDigit = useCallback(
    (digit: string) => {
      if (hasCalculated) {
        const nextDigit = digit === '00' || digit === '0' ? '0' : digit
        setDisplay(nextDigit)
        setExpression('')
        setPrevOperand(null)
        setOperator(null)
        setIsNewNumber(false)
        setHasCalculated(false)
        return
      }

      if (isNewNumber || display === '0' || display === 'Error') {
        setIsNewNumber(false)
        const nextDigit = digit === '00' || digit === '0' ? '0' : digit
        setDisplay(nextDigit)
        if (operator && prevOperand !== null) {
          setExpression(`${formatNumberClean(prevOperand)} ${operator} ${nextDigit}`)
        } else {
          setExpression('')
        }
        return
      }

      // If display already reached max digits limit, prevent overflow
      if (display.replace('.', '').length >= MAX_DIGITS) {
        return
      }

      const nextDisplay = display + digit
      setDisplay(nextDisplay)
      if (operator && prevOperand !== null) {
        setExpression(`${formatNumberClean(prevOperand)} ${operator} ${nextDisplay}`)
      }
    },
    [hasCalculated, isNewNumber, display, operator, prevOperand]
  )

  // Handle decimal dot
  const handleDot = useCallback(() => {
    if (hasCalculated) {
      setDisplay('0.')
      setExpression('')
      setPrevOperand(null)
      setOperator(null)
      setIsNewNumber(false)
      setHasCalculated(false)
      return
    }

    if (isNewNumber || display === 'Error') {
      setIsNewNumber(false)
      setDisplay('0.')
      if (operator && prevOperand !== null) {
        setExpression(`${formatNumberClean(prevOperand)} ${operator} 0.`)
      }
      return
    }

    if (display.includes('.')) {
      return
    }

    const nextDisplay = display + '.'
    setDisplay(nextDisplay)
    if (operator && prevOperand !== null) {
      setExpression(`${formatNumberClean(prevOperand)} ${operator} ${nextDisplay}`)
    }
  }, [hasCalculated, isNewNumber, display, operator, prevOperand])

  // Handle operators (+, -, ×, ÷)
  const handleOperator = useCallback(
    (nextOp: string) => {
      setHasCalculated(false)
      const currentVal = parseFloat(display)

      if (isNaN(currentVal) || display === 'Error') {
        return
      }

      if (isNewNumber && operator !== null && prevOperand !== null) {
        setOperator(nextOp)
        setExpression(`${formatNumberClean(prevOperand)} ${nextOp}`)
        return
      }

      if (prevOperand !== null && operator && !isNewNumber) {
        // Intermediate calculation
        const res = calculate(prevOperand, operator, currentVal)
        if (isNaN(res) || !isFinite(res)) {
          setDisplay('Error')
          setExpression(`${formatNumberClean(prevOperand)} ${operator} ${formatNumberClean(currentVal)} =`)
          setPrevOperand(null)
          setOperator(null)
          setIsNewNumber(true)
          return
        }
        setDisplay(formatNumberClean(res))
        setPrevOperand(res)
        setOperator(nextOp)
        setExpression(`${formatNumberClean(res)} ${nextOp}`)
        setIsNewNumber(true)
      } else {
        setPrevOperand(currentVal)
        setOperator(nextOp)
        setExpression(`${formatNumberClean(currentVal)} ${nextOp}`)
        setIsNewNumber(true)
      }
    },
    [display, isNewNumber, operator, prevOperand]
  )

  // Handle equals (=)
  const handleEquals = useCallback(() => {
    if (operator === null || prevOperand === null) return

    const currentVal = parseFloat(display)
    if (isNaN(currentVal) || display === 'Error') return

    const res = calculate(prevOperand, operator, currentVal)
    if (isNaN(res) || !isFinite(res)) {
      setDisplay('Error')
      setExpression(`${formatNumberClean(prevOperand)} ${operator} ${formatNumberClean(currentVal)} =`)
      setPrevOperand(null)
      setOperator(null)
    } else {
      const formattedRes = formatNumberClean(res)
      setDisplay(formattedRes)
      // Display full completed equation with = sign so it never appears empty!
      setExpression(`${formatNumberClean(prevOperand)} ${operator} ${formatNumberClean(currentVal)} =`)
      setPrevOperand(res)
      setOperator(null)
    }

    setIsNewNumber(true)
    setHasCalculated(true)
  }, [operator, prevOperand, display])

  // Handle clear (C)
  const handleClear = useCallback(() => {
    setDisplay('0')
    setExpression('')
    setPrevOperand(null)
    setOperator(null)
    setIsNewNumber(true)
    setHasCalculated(false)
  }, [])

  // Backspace
  const handleBackspace = useCallback(() => {
    if (hasCalculated) {
      handleClear()
      return
    }

    if (isNewNumber || display === 'Error' || display.length <= 1) {
      setDisplay('0')
      setIsNewNumber(true)
      if (operator && prevOperand !== null) {
        setExpression(`${formatNumberClean(prevOperand)} ${operator}`)
      } else {
        setExpression('')
      }
      return
    }

    const sliced = display.slice(0, -1)
    const nextDisplay = sliced === '' || sliced === '-' ? '0' : sliced
    setDisplay(nextDisplay)
    if (operator && prevOperand !== null) {
      setExpression(`${formatNumberClean(prevOperand)} ${operator} ${nextDisplay}`)
    }
  }, [hasCalculated, isNewNumber, display, operator, prevOperand, handleClear])

  // Percentage
  const handlePercent = useCallback(() => {
    const currentVal = parseFloat(display)
    if (isNaN(currentVal) || display === 'Error') return

    if (prevOperand !== null && (operator === '+' || operator === '-')) {
      const percentVal = (prevOperand * currentVal) / 100
      const res = Math.round(percentVal * 100000) / 100000
      setDisplay(formatNumberClean(res))
      setExpression(`${formatNumberClean(prevOperand)} ${operator} ${formatNumberClean(res)}`)
    } else {
      const res = Math.round((currentVal / 100) * 1000000) / 1000000
      setDisplay(formatNumberClean(res))
      setExpression(`${formatNumberClean(res)}`)
    }
    setIsNewNumber(true)
  }, [display, prevOperand, operator])

  // Dynamic font sizing based on digit length to guarantee zero overflow
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
              setDisplay(formatNumberClean(totalPayable))
              setExpression('')
              setPrevOperand(null)
              setOperator(null)
              setIsNewNumber(true)
              setHasCalculated(false)
            }}
            className="text-[11px] text-emerald-700 hover:underline font-mono font-semibold transition-colors cursor-pointer"
            title="Load invoice total into calculator"
          >
            Load Total ({totalPayable.toLocaleString()})
          </button>
        )}
      </div>

      {/* 2. Digital LCD Screen Display (Solid right alignment, no text shifting) */}
      <div className="bg-gray-950 text-white rounded-[5px] px-3.5 py-2 flex flex-col justify-between font-mono shadow-inner min-h-[64px] border border-gray-800 shrink-0 overflow-hidden select-none">
        {/* Top Formula / Equation Line */}
        <div className="w-full h-4.5 flex items-center justify-end overflow-hidden">
          <span className="text-xs text-gray-400 font-mono tracking-wide truncate select-none">
            {expression || '\u00A0'}
          </span>
        </div>

        {/* Main Value Display */}
        <div className="w-full flex items-baseline justify-end overflow-hidden">
          <span
            className={`font-black tracking-wider text-emerald-400 font-mono leading-none truncate ${displayFontSize}`}
          >
            {display}
          </span>
        </div>
      </div>

      {/* 3. Button Matrix */}
      <div className="grid grid-cols-4 grid-rows-5 gap-1.5 flex-1 min-h-0 select-none">
        {/* Row 1: Clear, Backspace, %, ÷ */}
        <button
          type="button"
          onClick={handleClear}
          className="h-full min-h-[38px] rounded-[5px] bg-red-50 hover:bg-red-100 active:scale-[0.98] border border-red-200 text-red-700 font-black text-sm flex items-center justify-center transition-all shadow-2xs cursor-pointer"
          title="Clear"
        >
          C
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
