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
    if (len > 12) return 'text-sm sm:text-base'
    if (len > 9) return 'text-base sm:text-lg'
    if (len > 6) return 'text-lg sm:text-xl'
    return 'text-xl sm:text-2xl'
  }, [display])

  return (
    <div className="w-full bg-[#FAFAFA] border border-gray-200/60 rounded-[8px] p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-2 shrink-0">
      {/* 1. Header */}
      <div className="flex items-center justify-between border-b border-gray-200/50 pb-1 shrink-0">
        <div className="flex items-center gap-1.5 text-[#4A7C6F]">
          <Calculator className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold text-[#1F2937]">Cashier Calculator</span>
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
            className="text-[11px] text-[#4A7C6F] hover:underline font-mono font-medium transition-colors cursor-pointer"
            title="Load invoice total into calculator"
          >
            Load Total ({totalPayable.toLocaleString()})
          </button>
        )}
      </div>

      {/* 2. Digital LCD Screen Display (Dark Slate #1E293B with White/Cream digits, solid right alignment) */}
      <div className="w-full h-16 min-h-[60px] max-h-[64px] bg-[#1E293B] text-slate-100 rounded-[8px] px-3.5 py-2 flex flex-col justify-between font-mono shadow-inner border border-slate-700/40 shrink-0 overflow-hidden select-none">
        {/* Top Formula / Equation Line */}
        <div className="w-full h-4 flex items-center justify-end overflow-hidden">
          <span className="text-[11px] text-slate-400 font-mono tracking-wide truncate select-none leading-none">
            {expression || '\u00A0'}
          </span>
        </div>

        {/* Main Value Display */}
        <div className="w-full flex items-baseline justify-end overflow-hidden">
          <span
            className={`font-mono font-semibold tracking-wider text-slate-100 leading-none truncate ${displayFontSize}`}
          >
            {display}
          </span>
        </div>
      </div>

      {/* 3. Keypad Matrix (Tamed visual hierarchy matching Sage Green theme) */}
      <div className="w-full grid grid-cols-4 gap-1.5 select-none">
        {/* Row 1: Clear (Soft Red), Backspace, %, ÷ (Soft Slate) */}
        <button
          type="button"
          onClick={handleClear}
          className="w-full h-[40px] xl:h-[42px] min-h-[38px] rounded-[8px] bg-rose-50 hover:bg-rose-100 active:scale-[0.98] text-rose-700 font-bold text-xs flex items-center justify-center transition-all cursor-pointer border border-rose-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          title="Clear"
        >
          C
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          className="w-full h-[40px] xl:h-[42px] min-h-[38px] rounded-[8px] bg-slate-100 hover:bg-slate-200/80 active:scale-[0.98] text-slate-700 font-semibold text-xs flex items-center justify-center transition-all cursor-pointer border border-slate-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          title="Backspace"
        >
          <Delete className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handlePercent}
          className="w-full h-[40px] xl:h-[42px] min-h-[38px] rounded-[8px] bg-slate-100 hover:bg-slate-200/80 active:scale-[0.98] text-slate-700 font-semibold text-xs flex items-center justify-center transition-all cursor-pointer border border-slate-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
        >
          %
        </button>
        <button
          type="button"
          onClick={() => handleOperator('÷')}
          className={`w-full h-[40px] xl:h-[42px] min-h-[38px] rounded-[8px] font-semibold text-base flex items-center justify-center transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)] active:scale-[0.98] ${
            operator === '÷'
              ? 'bg-[#5A8F7B]/20 text-[#2E4F46] font-bold border-2 border-[#5A8F7B]'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/70'
          }`}
        >
          ÷
        </button>

        {/* Row 2: 7, 8, 9, × (Soft Slate) */}
        <button
          type="button"
          onClick={() => handleDigit('7')}
          className="w-full h-[40px] xl:h-[42px] min-h-[38px] rounded-[8px] bg-white hover:bg-gray-50 active:scale-[0.98] text-slate-800 font-mono font-semibold text-sm shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-gray-200/80 transition-all flex items-center justify-center cursor-pointer"
        >
          7
        </button>
        <button
          type="button"
          onClick={() => handleDigit('8')}
          className="w-full h-[40px] xl:h-[42px] min-h-[38px] rounded-[8px] bg-white hover:bg-gray-50 active:scale-[0.98] text-slate-800 font-mono font-semibold text-sm shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-gray-200/80 transition-all flex items-center justify-center cursor-pointer"
        >
          8
        </button>
        <button
          type="button"
          onClick={() => handleDigit('9')}
          className="w-full h-[40px] xl:h-[42px] min-h-[38px] rounded-[8px] bg-white hover:bg-gray-50 active:scale-[0.98] text-slate-800 font-mono font-semibold text-sm shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-gray-200/80 transition-all flex items-center justify-center cursor-pointer"
        >
          9
        </button>
        <button
          type="button"
          onClick={() => handleOperator('×')}
          className={`w-full h-[40px] xl:h-[42px] min-h-[38px] rounded-[8px] font-semibold text-base flex items-center justify-center transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)] active:scale-[0.98] ${
            operator === '×'
              ? 'bg-[#5A8F7B]/20 text-[#2E4F46] font-bold border-2 border-[#5A8F7B]'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/70'
          }`}
        >
          ×
        </button>

        {/* Row 3: 4, 5, 6, - (Soft Slate) */}
        <button
          type="button"
          onClick={() => handleDigit('4')}
          className="w-full h-[40px] xl:h-[42px] min-h-[38px] rounded-[8px] bg-white hover:bg-gray-50 active:scale-[0.98] text-slate-800 font-mono font-semibold text-sm shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-gray-200/80 transition-all flex items-center justify-center cursor-pointer"
        >
          4
        </button>
        <button
          type="button"
          onClick={() => handleDigit('5')}
          className="w-full h-[40px] xl:h-[42px] min-h-[38px] rounded-[8px] bg-white hover:bg-gray-50 active:scale-[0.98] text-slate-800 font-mono font-semibold text-sm shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-gray-200/80 transition-all flex items-center justify-center cursor-pointer"
        >
          5
        </button>
        <button
          type="button"
          onClick={() => handleDigit('6')}
          className="w-full h-[40px] xl:h-[42px] min-h-[38px] rounded-[8px] bg-white hover:bg-gray-50 active:scale-[0.98] text-slate-800 font-mono font-semibold text-sm shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-gray-200/80 transition-all flex items-center justify-center cursor-pointer"
        >
          6
        </button>
        <button
          type="button"
          onClick={() => handleOperator('-')}
          className={`w-full h-[40px] xl:h-[42px] min-h-[38px] rounded-[8px] font-semibold text-base flex items-center justify-center transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)] active:scale-[0.98] ${
            operator === '-'
              ? 'bg-[#5A8F7B]/20 text-[#2E4F46] font-bold border-2 border-[#5A8F7B]'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/70'
          }`}
        >
          -
        </button>

        {/* Row 4: 1, 2, 3, + (Soft Slate) */}
        <button
          type="button"
          onClick={() => handleDigit('1')}
          className="w-full h-[40px] xl:h-[42px] min-h-[38px] rounded-[8px] bg-white hover:bg-gray-50 active:scale-[0.98] text-slate-800 font-mono font-semibold text-sm shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-gray-200/80 transition-all flex items-center justify-center cursor-pointer"
        >
          1
        </button>
        <button
          type="button"
          onClick={() => handleDigit('2')}
          className="w-full h-[40px] xl:h-[42px] min-h-[38px] rounded-[8px] bg-white hover:bg-gray-50 active:scale-[0.98] text-slate-800 font-mono font-semibold text-sm shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-gray-200/80 transition-all flex items-center justify-center cursor-pointer"
        >
          2
        </button>
        <button
          type="button"
          onClick={() => handleDigit('3')}
          className="w-full h-[40px] xl:h-[42px] min-h-[38px] rounded-[8px] bg-white hover:bg-gray-50 active:scale-[0.98] text-slate-800 font-mono font-semibold text-sm shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-gray-200/80 transition-all flex items-center justify-center cursor-pointer"
        >
          3
        </button>
        <button
          type="button"
          onClick={() => handleOperator('+')}
          className={`w-full h-[40px] xl:h-[42px] min-h-[38px] rounded-[8px] font-semibold text-base flex items-center justify-center transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)] active:scale-[0.98] ${
            operator === '+'
              ? 'bg-[#5A8F7B]/20 text-[#2E4F46] font-bold border-2 border-[#5A8F7B]'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/70'
          }`}
        >
          +
        </button>

        {/* Row 5: 0, 00, ., = (Action Button: Primary Brand Green) */}
        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="w-full h-[40px] xl:h-[42px] min-h-[38px] rounded-[8px] bg-white hover:bg-gray-50 active:scale-[0.98] text-slate-800 font-mono font-semibold text-sm shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-gray-200/80 transition-all flex items-center justify-center cursor-pointer"
        >
          0
        </button>
        <button
          type="button"
          onClick={() => handleDigit('00')}
          className="w-full h-[40px] xl:h-[42px] min-h-[38px] rounded-[8px] bg-white hover:bg-gray-50 active:scale-[0.98] text-slate-800 font-mono font-semibold text-sm shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-gray-200/80 transition-all flex items-center justify-center cursor-pointer"
        >
          00
        </button>
        <button
          type="button"
          onClick={handleDot}
          className="w-full h-[40px] xl:h-[42px] min-h-[38px] rounded-[8px] bg-white hover:bg-gray-50 active:scale-[0.98] text-slate-800 font-mono font-semibold text-sm shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-gray-200/80 transition-all flex items-center justify-center cursor-pointer"
        >
          .
        </button>
        <button
          type="button"
          onClick={handleEquals}
          className="w-full h-[40px] xl:h-[42px] min-h-[38px] rounded-[8px] bg-[#5A8F7B] hover:bg-[#4A7C6F] active:bg-[#3D665B] active:scale-[0.98] text-white font-bold text-lg shadow-sm flex items-center justify-center transition-all cursor-pointer border-0"
          title="Calculate"
        >
          =
        </button>
      </div>

      {/* 4. Secondary Action Button (Apply to Cash Paid) */}
      {onApplyToPaid && (
        <div className="w-full shrink-0 pt-0.5">
          <button
            type="button"
            onClick={() => {
              const val = parseFloat(display)
              if (!isNaN(val) && val >= 0) {
                onApplyToPaid(val)
              }
            }}
            className="w-full py-1.5 px-3 h-7 rounded-[7px] bg-white hover:bg-[#5A8F7B]/10 active:scale-[0.99] border border-gray-200/80 text-[#3D665B] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <ArrowDownToLine className="w-3.5 h-3.5 text-[#5A8F7B]" />
            <span>Apply to Cash Paid</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default CalculatorNumpad
