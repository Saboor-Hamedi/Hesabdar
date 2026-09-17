import { useTranslation } from 'react-i18next'
import { Package, AlertTriangle, Boxes, Coins } from 'lucide-react'
import type { Product } from '../../../core/types'
import { Card } from '../../../components/ui/Card'
import { formatCurrency, formatNumber } from '../../../core/utils/formatters'

interface ProductStatsProps {
  products: Product[]
}

/**
 * ProductStats: Sleek KPI cards for products and inventory valuation.
 */
export function ProductStats({ products }: ProductStatsProps) {
  const { t } = useTranslation()

  const totalProducts = products.length
  const lowStockItems = products.filter((p) => p.stock_qty <= (p.reorder_level || 5))
  const totalStockUnits = products.reduce((sum, p) => sum + (p.stock_qty || 0), 0)
  const totalCostValue = products.reduce((sum, p) => sum + (p.cost_price || 0) * (p.stock_qty || 0), 0)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-medium">{t('nav.products')}</span>
          <Package className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-base font-bold font-mono text-gray-900">{formatNumber(totalProducts)}</span>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-[5px] font-medium">
            {t('products.activeCatalog')}
          </span>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-medium">{t('products.lowStockAlerts')}</span>
          <AlertTriangle className="w-4 h-4 text-amber-500" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-base font-bold font-mono text-amber-700">{formatNumber(lowStockItems.length)}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-[5px] font-medium ${
            lowStockItems.length > 0 ? 'bg-amber-50 text-amber-800' : 'bg-gray-100 text-gray-600'
          }`}>
            {t('products.needsReorder')}
          </span>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-medium">{t('products.totalQuantity')}</span>
          <Boxes className="w-4 h-4 text-blue-500" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-base font-bold font-mono text-gray-900">{formatNumber(totalStockUnits)}</span>
          <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-[5px] font-medium">
            {t('products.itemsInHand')}
          </span>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400 font-medium">{t('products.stockValueCost')}</span>
          <Coins className="w-4 h-4 text-purple-600" />
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-base font-bold font-mono text-purple-800">{formatCurrency(totalCostValue)}</span>
          <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-[5px] font-medium">
            {t('products.assetBasis')}
          </span>
        </div>
      </Card>
    </div>
  )
}
