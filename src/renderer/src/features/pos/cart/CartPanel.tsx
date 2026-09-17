import { useTranslation } from 'react-i18next'
import { ShoppingCart, Trash2 } from 'lucide-react'
import type { CartItem } from '../../../core/types'
import { CartItemRow } from './CartItemRow'
import { CartSummary } from './CartSummary'

interface CartPanelProps {
  cart: CartItem[]
  subtotal: number
  discount: number
  total: number
  onUpdateQty: (productId: number, delta: number) => void
  onSetItemQty: (productId: number, qty: number) => void
  onRemoveItem: (productId: number) => void
  onClearCart: () => void
  onDiscountChange: (val: number) => void
  onCheckout: () => void
}

/**
 * CartPanel: The complete modular checkout sidebar for POS.
 */
export function CartPanel({
  cart,
  subtotal,
  discount,
  total,
  onUpdateQty,
  onSetItemQty,
  onRemoveItem,
  onClearCart,
  onDiscountChange,
  onCheckout,
}: CartPanelProps) {
  const { t } = useTranslation()

  return (
    <div className="w-80 bg-white border border-gray-200/90 rounded-[5px] flex flex-col justify-between shadow-xs overflow-hidden">
      {/* Cart Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-1.5">
          <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-xs font-semibold text-gray-800">{t('pos.currentInvoice')}</span>
        </div>
        {cart.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-[11px] text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> {t('common.clear')}
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-2 divide-y divide-gray-100">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-1 py-12">
            <ShoppingCart className="w-8 h-8 stroke-[1.5] text-gray-300" />
            <p className="text-xs">{t('pos.emptyCart')}</p>
            <span className="text-[10px] text-gray-400">{t('pos.clickOrScan')}</span>
          </div>
        ) : (
          cart.map((item) => (
            <CartItemRow
              key={item.product_id}
              item={item}
              onUpdateQty={onUpdateQty}
              onSetItemQty={onSetItemQty}
              onRemoveItem={onRemoveItem}
            />
          ))
        )}
      </div>

      {/* Invoice Summary & Checkout Footer */}
      <CartSummary
        subtotal={subtotal}
        discount={discount}
        total={total}
        itemCount={cart.length}
        onDiscountChange={onDiscountChange}
        onCheckout={onCheckout}
      />
    </div>
  )
}
