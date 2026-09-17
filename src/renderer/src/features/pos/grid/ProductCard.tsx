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
      className={`bg-white border rounded-[5px] p-3 flex flex-col justify-between transition-colors shadow-xs select-none ${
        isOutOfStock
          ? 'border-gray-200 opacity-60 cursor-not-allowed bg-gray-50'
          : 'border-gray-200/90 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/20'
      }`}
    >
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-400 font-mono">{product.barcode || `#${product.id}`}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-[3px] bg-gray-100 text-gray-600 uppercase font-medium">
            {product.unit}
          </span>
        </div>
        <h4 className="text-xs font-semibold text-gray-800 line-clamp-1 mt-1">
          {product.name_fa || product.name_en || 'Product'}
        </h4>
        {product.name_en && product.name_fa && (
          <span className="text-[10px] text-gray-400 line-clamp-1">{product.name_en}</span>
        )}
      </div>

      <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-gray-100">
        <span
          className={`text-[10px] font-mono ${
            isOutOfStock ? 'text-red-500 font-medium' : 'text-gray-500'
          }`}
        >
          {t('pos.stock')}: <strong className="text-gray-800">{product.stock_qty}</strong> {product.unit}
        </span>
        <span className="font-mono font-bold text-xs text-emerald-700">
          {formatCurrency(product.sell_price)}
        </span>
      </div>
    </div>
  )
}
