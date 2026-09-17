import { Minus, Plus, Trash2 } from 'lucide-react'
import type { CartItem } from '../../../core/types'
import { formatCurrency } from '../../../core/utils/formatters'

interface CartItemRowProps {
  item: CartItem
  onUpdateQty: (productId: number, delta: number) => void
  onSetItemQty: (productId: number, qty: number) => void
  onRemoveItem: (productId: number) => void
}

/**
 * CartItemRow: Sleek single line item inside the POS cart with amount & unit controls.
 */
export function CartItemRow({
  item,
  onUpdateQty,
  onSetItemQty,
  onRemoveItem,
}: CartItemRowProps) {
  return (
    <div className="py-2 flex items-center justify-between gap-2">
      <div className="flex-1 min-w-0">
        <h5 className="text-xs font-medium text-gray-800 truncate">{item.product_name}</h5>
        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono mt-0.5">
          <span>
            {formatCurrency(item.unit_price)} / {item.unit || 'pcs'}
          </span>
          <span>•</span>
          <span className="text-emerald-700 font-semibold">
            {formatCurrency(item.line_total)}
          </span>
        </div>
      </div>

      {/* Amount / Qty Stepper & Editable Amount Input */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onUpdateQty(item.product_id, -1)}
          className="w-5 h-5 flex items-center justify-center rounded-[5px] border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <Minus className="w-2.5 h-2.5" />
        </button>

        <div className="flex items-center gap-0.5 bg-gray-50 border border-gray-200 rounded-[5px] px-1 py-0.5">
          <input
            type="number"
            step="any"
            min="0.01"
            value={item.qty}
            onChange={(e) => onSetItemQty(item.product_id, parseFloat(e.target.value) || 0)}
            className="w-11 text-center text-xs font-mono font-semibold bg-transparent focus:outline-none focus:ring-0"
          />
          <span className="text-[10px] text-gray-500 font-medium lowercase pe-0.5">
            {item.unit || 'pcs'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onUpdateQty(item.product_id, 1)}
          className="w-5 h-5 flex items-center justify-center rounded-[5px] border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <Plus className="w-2.5 h-2.5" />
        </button>
        <button
          type="button"
          onClick={() => onRemoveItem(item.product_id)}
          className="ms-1 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
