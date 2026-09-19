import { Clock, Play, Trash2, User, ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { formatCurrency, formatNumber } from '../../../core/utils/formatters'
import type { HeldCart } from './types'

interface HeldCartsModalProps {
  isOpen: boolean
  onClose: () => void
  heldCarts: HeldCart[]
  onResume: (cart: HeldCart) => void
  onDelete: (id: string) => void
  onClearAll: () => void
}

export function HeldCartsModal({
  isOpen,
  onClose,
  heldCarts,
  onResume,
  onDelete,
  onClearAll,
}: HeldCartsModalProps) {
  const { t } = useTranslation()

  const formatHeldTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('pos.heldInvoices', 'Held Invoices (Cart Parking)')}
      subtitle={t(
        'pos.heldInvoicesSubtitle',
        'Resume parked customer transactions or remove them when no longer needed.'
      )}
      badge={
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/50 shadow-2xs font-mono">
          {heldCarts.length} {t('pos.held', 'held')}
        </span>
      }
      style={{ width: '680px', maxWidth: '95vw' }}
      className="flex flex-col max-h-[85vh]"
      bodyClassName="flex-1 flex flex-col p-5 overflow-hidden"
    >
      {/* Scrollable Carts List */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3">
        {heldCarts.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center text-gray-400 dark:text-slate-500">
            <div className="w-14 h-14 rounded-full bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 flex items-center justify-center mb-3 text-gray-400 dark:text-slate-400">
              <Clock className="w-7 h-7 stroke-[1.5]" />
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">
              {t('pos.noHeldCarts', 'No Held Invoices')}
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 max-w-sm">
              {t(
                'pos.noHeldCartsDesc',
                'You can put an in-progress customer cart on hold at any time to serve the next customer in line.'
              )}
            </p>
          </div>
        ) : (
          heldCarts.map((hc) => {
            const totalQty = hc.items.reduce((acc, it) => acc + (it.qty || 0), 0)
            const itemPreview = hc.items
              .slice(0, 3)
              .map((it) => `${it.qty}x ${it.product_name || 'Item'}`)
              .join(' • ')
            const remainingCount = hc.items.length - 3

            return (
              <div
                key={hc.id}
                className="bg-white dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 rounded-xl p-4 shadow-xs transition-all flex flex-col gap-3 group"
              >
                {/* Card Header: Customer & Timestamp */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#4A7C6F]/10 dark:bg-[#5A8F7B]/20 text-[#4A7C6F] dark:text-[#7EBCA8] flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-slate-100">
                        {hc.customerName || t('pos.walkInCustomer', 'Walk-in Customer')}
                      </h4>
                      <p className="text-[11px] text-gray-400 dark:text-slate-500 font-mono">
                        {formatHeldTime(hc.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 border border-gray-200/60 dark:border-slate-600">
                      {hc.paymentMode.toUpperCase()}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#4A7C6F]/10 dark:bg-[#5A8F7B]/20 text-[#2E4F46] dark:text-[#7EBCA8] border border-[#4A7C6F]/20 dark:border-[#5A8F7B]/30">
                      {hc.items.length} {t('pos.items', 'items')} ({formatNumber(totalQty)}{' '}
                      {t('pos.units', 'units')})
                    </span>
                  </div>
                </div>

                {/* Card Body: Items Preview */}
                <div className="bg-gray-50/70 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-gray-600 dark:text-slate-300 flex items-center gap-2">
                  <ShoppingBag className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
                  <span className="truncate">
                    {itemPreview}
                    {remainingCount > 0 && ` +${remainingCount} more`}
                  </span>
                </div>

                {/* Card Footer: Total & Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-slate-700">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                      {t('pos.total', 'Total')}:
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-slate-100 font-mono">
                      {formatCurrency(hc.total)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onDelete(hc.id)}
                      className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer"
                      title={t('common.delete', 'Delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <Button
                      variant="primary"
                      onClick={() => onResume(hc)}
                      className="bg-[#4A7C6F] hover:bg-[#3d675c] text-white text-xs px-3 py-1.5 h-8 font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{t('pos.resumeCart', 'Resume Cart')}</span>
                    </Button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal Actions Footer */}
      <div className="pt-4 border-t border-gray-200/80 dark:border-slate-800 mt-3 flex items-center justify-between">
        {heldCarts.length > 0 ? (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('pos.clearAllHeld', 'Clear All Held Carts')}</span>
          </button>
        ) : (
          <div />
        )}

        <Button
          variant="secondary"
          onClick={onClose}
          className="text-xs px-4 h-8 rounded-lg cursor-pointer"
        >
          {t('common.close', 'Close')}
        </Button>
      </div>
    </Modal>
  )
}
