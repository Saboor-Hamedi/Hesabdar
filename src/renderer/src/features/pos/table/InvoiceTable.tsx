import { Trash2, Minus, Plus, ShoppingCart, Package } from 'lucide-react'
import type { CartItem } from '../../../core/types'
import { formatCurrency, formatNumber } from '../../../core/utils/formatters'

interface InvoiceTableProps {
  items: CartItem[]
  onUpdateQty: (productId: number, delta: number) => void
  onSetItemQty: (productId: number, qty: number) => void
  onRemoveItem: (productId: number) => void
  onClearAll: () => void
}

/**
 * InvoiceTable: The primary live transaction table showing all customer purchased items.
 */
export function InvoiceTable({
  items,
  onUpdateQty,
  onSetItemQty,
  onRemoveItem,
  onClearAll,
}: InvoiceTableProps) {
  const totalUnits = items.reduce((sum, it) => sum + (it.qty || 0), 0)

  return (
    <div className="flex-1 bg-white border border-gray-200/80 rounded-[8px] flex flex-col justify-between shadow-xs overflow-hidden min-h-[340px]">
      {/* Table Header Bar */}
      <div className="px-3 py-2.5 bg-gray-50/70 border-b border-gray-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-[#4A7C6F]" />
          <span className="text-xs font-bold text-gray-900">
            Invoice Items
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-[6px] bg-[#4A7C6F]/10 text-[#2E4F46] border border-[#4A7C6F]/20 font-mono font-bold">
            {items.length} items
          </span>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-[11px] text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors font-medium cursor-pointer"
          >
            <Trash2 className="w-3 h-3" /> Clear Invoice
          </button>
        )}
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-400">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Package className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-xs font-semibold text-gray-600">No commodities in current invoice</p>
            <p className="text-[11px] text-gray-400 mt-0.5 max-w-xs">
              Type the item name, barcode, amount, and price in the bar above, or scan a barcode to add.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] text-gray-500 font-semibold uppercase border-b border-gray-100">
                <th className="py-2 px-3 w-10 text-center">#</th>
                <th className="py-2 px-3">Item Description</th>
                <th className="py-2 px-3 text-center w-36">Quantity</th>
                <th className="py-2 px-3 text-center w-16">Unit</th>
                <th className="py-2 px-3 text-end w-28">Unit Price</th>
                <th className="py-2 px-3 text-end w-32">Total</th>
                <th className="py-2 px-2 w-10 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {items.map((it, idx) => (
                <tr key={it.product_id} className="hover:bg-gray-50/60 transition-colors">
                  {/* Row # */}
                  <td className="py-2 px-3 text-center text-gray-400 font-mono text-[11px]">
                    {idx + 1}
                  </td>

                  {/* Name */}
                  <td className="py-2 px-3">
                    <div className="font-semibold text-gray-900 leading-snug">
                      {it.product_name}
                    </div>
                  </td>

                  {/* Quantity Stepper & Direct Input */}
                  <td className="py-2 px-3 text-center">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(it.product_id, -1)}
                        className="w-5 h-5 flex items-center justify-center rounded-[3px] border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>

                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        value={it.qty}
                        onChange={(e) =>
                          onSetItemQty(it.product_id, parseFloat(e.target.value) || 0)
                        }
                        className="w-14 h-6 text-center text-xs font-mono font-bold border border-gray-200 rounded-[4px] bg-white text-gray-800 focus:outline-none focus:border-[#4A7C6F]"
                      />

                      <button
                        type="button"
                        onClick={() => onUpdateQty(it.product_id, 1)}
                        className="w-5 h-5 flex items-center justify-center rounded-[4px] border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </td>

                  {/* Unit */}
                  <td className="py-2 px-3 text-center">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-gray-100 text-gray-700 font-mono uppercase">
                      {it.unit || 'pcs'}
                    </span>
                  </td>

                  {/* Unit Price */}
                  <td className="py-2 px-3 text-end font-mono text-gray-700">
                    {formatCurrency(it.unit_price)}
                  </td>

                  {/* Line Total */}
                  <td className="py-2 px-3 text-end font-mono font-bold text-[#2E4F46] text-xs">
                    {formatCurrency(it.line_total)}
                  </td>

                  {/* Actions */}
                  <td className="py-2 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(it.product_id)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-[4px] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Table Footer Ledger Bar */}
      <div className="px-3 py-2 bg-gray-50/80 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-3">
          <span>
            Total Items: <strong className="text-gray-900 font-mono">{items.length}</strong>
          </span>
          <span>•</span>
          <span>
            Total Amount / Units:{' '}
            <strong className="text-gray-900 font-mono">{formatNumber(totalUnits)}</strong>
          </span>
        </div>
        <span className="text-[10px] text-gray-400">Standard Afghan POS Ledger</span>
      </div>
    </div>
  )
}

export default InvoiceTable
