import { useState } from 'react'
import { Trash2, Minus, Plus, ShoppingCart, Package, PauseCircle, Clock, AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { CartItem } from '../../../core/types'
import { formatCurrency, formatNumber } from '../../../core/utils/formatters'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'

interface InvoiceTableProps {
  items: CartItem[]
  onUpdateQty: (productId: number, delta: number) => void
  onSetItemQty: (productId: number, qty: number) => void
  onRemoveItem: (productId: number) => void
  onClearAll: () => void
  onHoldCart?: () => void
  onOpenHeldCarts?: () => void
  heldCount?: number
}

/**
 * InvoiceTable: The primary live transaction table showing all customer purchased items.
 * Polished for active sales: increased row breathing room, centered monospaced stepper,
 * neutral utility badges, and clear-action confirmation.
 */
export function InvoiceTable({
  items,
  onUpdateQty,
  onSetItemQty,
  onRemoveItem,
  onClearAll,
  onHoldCart,
  onOpenHeldCarts,
  heldCount = 0,
}: InvoiceTableProps) {
  const { t } = useTranslation()
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false)
  const totalUnits = items.reduce((sum, it) => sum + (it.qty || 0), 0)

  const handleConfirmClear = () => {
    setIsConfirmClearOpen(false)
    onClearAll()
  }

  return (
    <div className="flex-1 bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-[8px] flex flex-col justify-between shadow-xs overflow-hidden min-h-[340px]">
      {/* Table Header Bar */}
      <div className="px-3 py-2 bg-gray-50/70 dark:bg-slate-800/60 border-b border-gray-200/80 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-[#4A7C6F] dark:text-[#5A8F7B]" />
          <span className="text-xs font-bold text-gray-900 dark:text-slate-100">
            {t('pos.currentInvoice', 'Invoice Items')}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-[6px] bg-[#4A7C6F]/10 dark:bg-[#5A8F7B]/20 text-[#2E4F46] dark:text-[#7EBCA8] border border-[#4A7C6F]/20 dark:border-[#5A8F7B]/30 font-mono font-bold">
            {items.length} {t('pos.items', 'items')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Held Invoices Parking Button - Neutral utility badge (Slate Gray) */}
          {onOpenHeldCarts && (
            <button
              type="button"
              onClick={onOpenHeldCarts}
              className={`text-[11px] px-2.5 py-1 rounded-[6px] flex items-center gap-1.5 transition-all font-medium cursor-pointer shadow-2xs border ${
                heldCount > 0
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-200/80 dark:hover:bg-slate-700 font-semibold'
                  : 'bg-gray-50 dark:bg-slate-800/40 text-gray-400 dark:text-slate-500 border-gray-200/70 dark:border-slate-700/60 hover:bg-gray-100/80 dark:hover:bg-slate-800/80'
              }`}
              title={t('pos.heldInvoices', 'Held Invoices (Cart Parking)')}
            >
              <Clock className={`w-3.5 h-3.5 ${heldCount > 0 ? 'text-slate-600 dark:text-slate-300' : 'text-gray-400 dark:text-slate-500'}`} />
              <span>{t('pos.heldInvoices', 'Held Invoices')}</span>
              <span
                className={`font-mono font-bold text-[10px] px-1.5 py-0.2 rounded-full ${
                  heldCount > 0
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                    : 'bg-gray-200/70 dark:bg-slate-700/60 text-gray-400 dark:text-slate-400'
                }`}
              >
                {heldCount}
              </span>
            </button>
          )}

          {/* Hold Current Cart Button - Prominent outline when items > 0 */}
          {onHoldCart && (
            <button
              type="button"
              onClick={() => onHoldCart()}
              disabled={items.length === 0}
              className={`text-[11px] px-3 py-1 rounded-[6px] flex items-center gap-1.5 transition-all font-semibold border ${
                items.length > 0
                  ? 'border-[#4A7C6F] dark:border-[#5A8F7B] text-[#2E4F46] dark:text-[#7EBCA8] bg-[#4A7C6F]/10 dark:bg-[#5A8F7B]/20 hover:bg-[#4A7C6F]/20 dark:hover:bg-[#5A8F7B]/30 cursor-pointer shadow-2xs active:scale-95'
                  : 'border-gray-200 dark:border-slate-800 text-gray-400 dark:text-slate-600 bg-transparent cursor-not-allowed opacity-50'
              }`}
              title={items.length > 0 ? t('pos.holdCart', 'Hold Cart') : 'Add items first to hold cart'}
            >
              <PauseCircle className={`w-3.5 h-3.5 ${items.length > 0 ? 'text-[#4A7C6F] dark:text-[#5A8F7B]' : 'text-gray-400 dark:text-slate-600'}`} />
              <span>{t('pos.holdCart', 'Hold Cart')}</span>
            </button>
          )}

          {/* Destructive Clear Button - Separated to the far right with confirmation */}
          {items.length > 0 && (
            <>
              <div className="w-[1px] h-3.5 bg-gray-200/90 dark:bg-slate-700 mx-0.5" />
              <button
                type="button"
                onClick={() => setIsConfirmClearOpen(true)}
                className="text-[11px] text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:underline flex items-center gap-1 transition-colors font-medium cursor-pointer px-1 py-1"
                title="Clear invoice items"
              >
                <Trash2 className="w-3 h-3" />
                <span>{t('common.clear', 'Clear')}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-400 dark:text-slate-500">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-3">
              <Package className="w-6 h-6 text-gray-400 dark:text-slate-400" />
            </div>
            <p className="text-xs font-semibold text-gray-600 dark:text-slate-300">No commodities in current invoice</p>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 max-w-xs">
              Type the item name, barcode, amount, and price in the bar above, or scan a barcode to add.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/70 dark:bg-slate-800/60 text-[10px] text-gray-500 dark:text-slate-400 font-semibold uppercase border-b border-gray-100 dark:border-slate-800">
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3 text-center w-36">Quantity</th>
                <th className="py-2.5 px-3 text-center w-20">Unit</th>
                <th className="py-2.5 px-3 text-end w-28">Unit Price</th>
                <th className="py-2.5 px-3 text-end w-32">Total</th>
                <th className="py-2.5 px-2 w-10 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 font-medium">
              {items.map((it, idx) => (
                <tr
                  key={it.product_id}
                  className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-colors min-h-[52px]"
                >
                  {/* Row # */}
                  <td className="py-3 px-3 text-center text-gray-400 dark:text-slate-500 font-mono text-[11px]">
                    {idx + 1}
                  </td>

                  {/* Name */}
                  <td className="py-3 px-3">
                    <div className="font-semibold text-gray-900 dark:text-slate-100 leading-snug">
                      {it.product_name}
                    </div>
                  </td>

                  {/* Quantity Stepper & Centered Monospaced Input */}
                  <td className="py-3 px-3 text-center">
                    <div className="inline-flex items-center gap-1 justify-center">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(it.product_id, -1)}
                        className="w-6 h-6 flex items-center justify-center rounded-[5px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 active:scale-95 transition-all cursor-pointer shadow-2xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        value={it.qty}
                        onChange={(e) =>
                          onSetItemQty(it.product_id, parseFloat(e.target.value) || 0)
                        }
                        className="w-14 h-7 text-center text-xs font-mono font-bold border border-gray-200 dark:border-slate-700 rounded-[5px] bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:border-[#4A7C6F] dark:focus:border-[#5A8F7B] focus:ring-1 focus:ring-[#4A7C6F]/30"
                      />

                      <button
                        type="button"
                        onClick={() => onUpdateQty(it.product_id, 1)}
                        className="w-6 h-6 flex items-center justify-center rounded-[5px] border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 active:scale-95 transition-all cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  {/* Unit Pill Badge */}
                  <td className="py-3 px-3 text-center">
                    <span className="text-[11px] px-2 py-0.5 rounded-[5px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 font-mono font-semibold uppercase tracking-wider">
                      {it.unit || 'pcs'}
                    </span>
                  </td>

                  {/* Unit Price (Strictly Right-Aligned) */}
                  <td className="py-3 px-3 text-end font-mono font-medium text-xs text-gray-700 dark:text-slate-300">
                    {formatCurrency(it.unit_price)}
                  </td>

                  {/* Line Total (Strictly Right-Aligned) */}
                  <td className="py-3 px-3 text-end font-mono font-bold text-xs text-[#2E4F46] dark:text-[#7EBCA8]">
                    {formatCurrency(it.line_total)}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(it.product_id)}
                      className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-[5px] transition-colors cursor-pointer"
                      title="Remove item"
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
      <div className="px-3 py-2.5 bg-gray-50/80 dark:bg-slate-800/60 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between text-xs text-gray-600 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <span>
            Total Items: <strong className="text-gray-900 dark:text-slate-100 font-mono">{items.length}</strong>
          </span>
          <span>•</span>
          <span>
            Total Amount / Units:{' '}
            <strong className="text-gray-900 dark:text-slate-100 font-mono">{formatNumber(totalUnits)}</strong>
          </span>
        </div>
        <span className="text-[10px] text-gray-400 dark:text-slate-500">Standard Afghan POS Ledger</span>
      </div>

      {/* Clear Invoice Confirmation Modal */}
      <Modal
        isOpen={isConfirmClearOpen}
        onClose={() => setIsConfirmClearOpen(false)}
        title="Clear Current Invoice?"
        subtitle="This action will remove all commodities from the current active invoice."
        style={{ width: '420px', maxWidth: '90vw' }}
        compactHeader
      >
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 rounded-lg text-amber-900 dark:text-amber-200 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <p>
              Are you sure you want to clear <strong>{items.length} item(s)</strong>? If you need this order later, consider clicking <strong>Hold Cart</strong> instead.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
            <Button
              variant="secondary"
              onClick={() => setIsConfirmClearOpen(false)}
              className="text-xs px-3 h-8 rounded-lg cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmClear}
              className="text-xs px-3.5 h-8 rounded-lg cursor-pointer font-semibold shadow-xs"
            >
              Yes, Clear All
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default InvoiceTable
