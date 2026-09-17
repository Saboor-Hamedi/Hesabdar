import { Coins } from 'lucide-react'
import { formatCurrency } from '../../../core/utils/formatters'

interface ChangeCalculatorProps {
  total: number
  tenderedCash: number
  onChangeTendered: (val: number) => void
}

/**
 * ChangeCalculator: Cash tendered calculator with quick banknote chips and change return computation.
 */
export function ChangeCalculator({
  total,
  tenderedCash,
  onChangeTendered,
}: ChangeCalculatorProps) {
  const changeAmount = Math.max(0, tenderedCash - total)
  const isShort = tenderedCash > 0 && tenderedCash < total

  return (
    <div className="p-2.5 rounded-[5px] bg-emerald-50/50 border border-emerald-200 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-emerald-900 flex items-center gap-1">
          <Coins className="w-3.5 h-3.5 text-emerald-600" />
          Tendered Cash (مبلغ دریافتی):
        </span>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={tenderedCash || ''}
            onChange={(e) => onChangeTendered(Math.max(0, parseFloat(e.target.value) || 0))}
            placeholder={total.toString()}
            className="w-24 h-7 px-1.5 text-end font-mono font-bold text-xs rounded-[5px] border border-emerald-300 bg-white text-emerald-900 focus:outline-none focus:border-emerald-500"
          />
          <span className="text-[10px] font-semibold text-emerald-800">AFN</span>
        </div>
      </div>

      {/* Quick denomination banknote chips */}
      <div className="flex items-center gap-1 flex-wrap">
        <button
          type="button"
          onClick={() => onChangeTendered(total)}
          className="px-1.5 py-0.5 rounded-[3px] text-[10px] font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
        >
          Exact ({formatCurrency(total)})
        </button>
        {[50, 100, 500, 1000, 2000, 5000].map((bill) => (
          <button
            key={bill}
            type="button"
            onClick={() => onChangeTendered(bill)}
            className="px-1.5 py-0.5 rounded-[3px] text-[10px] font-medium bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors"
          >
            {bill}
          </button>
        ))}
      </div>

      {/* Change to Return Display */}
      <div className="flex items-center justify-between pt-1 border-t border-emerald-200/80 text-xs">
        <span className="font-semibold text-emerald-900">
          Change Return (پس‌انداز مشتری):
        </span>
        <span
          className={`font-mono font-bold text-sm ${
            isShort ? 'text-rose-600' : 'text-emerald-700'
          }`}
        >
          {isShort
            ? `Short by ${formatCurrency(total - tenderedCash)}`
            : formatCurrency(changeAmount)}
        </span>
      </div>
    </div>
  )
}
