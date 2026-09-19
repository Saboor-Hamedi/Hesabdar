import { useTranslation } from 'react-i18next'
import type { Product } from '../../../core/types'
import { formatCurrency } from '../../../core/utils/formatters'

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
}

/**
 * ProductCard: Sleek 5px-radius touch tile with stock amount and price badges.
 */
export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { t } = useTranslation()
  const isOutOfStock = product.stock_qty <= 0

  return (
    <div
      onClick={() => {
        if (!isOutOfStock) onAddToCart(product)
      }}
      className={`bg-white dark:bg-slate-900 border rounded-[5px] p-3 flex flex-col justify-between transition-colors shadow-xs select-none ${
        isOutOfStock
          ? 'border-gray-200 dark:border-slate-800 opacity-60 cursor-not-allowed bg-gray-50 dark:bg-slate-800/40'
          : 'border-gray-200/90 dark:border-slate-800 cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20'
      }`}
    >
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">{product.barcode || `#${product.id}`}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-[3px] bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 uppercase font-medium">
            {product.unit}
          </span>
        </div>
        <h4 className="text-xs font-semibold text-gray-800 dark:text-slate-100 line-clamp-1 mt-1">
          {product.name_fa || product.name_en || 'Product'}
        </h4>
        {product.name_en && product.name_fa && (
          <span className="text-[10px] text-gray-400 dark:text-slate-500 line-clamp-1">{product.name_en}</span>
        )}
      </div>

      <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-gray-100 dark:border-slate-800">
        <span
          className={`text-[10px] font-mono ${
            isOutOfStock ? 'text-red-500 dark:text-rose-400 font-medium' : 'text-gray-500 dark:text-slate-400'
          }`}
        >
          {t('pos.stock')}: <strong className="text-gray-800 dark:text-slate-200">{product.stock_qty}</strong> {product.unit}
        </span>
        <span className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400">
          {formatCurrency(product.sell_price)}
        </span>
      </div>
    </div>
  )
}
