import { useTranslation } from 'react-i18next'
import { Package, AlertTriangle, Boxes, Coins } from 'lucide-react'
import type { Product } from '../../../core/types'
import { StatCard, StatsGrid } from '../../../components/ui/StatCard'
import { formatCurrency, formatNumber } from '../../../core/utils/formatters'

interface ProductStatsProps {
  products: Product[]
}

/**
 * ProductStats: Standardized KPI cards for products and inventory valuation.
 */
export function ProductStats({ products }: ProductStatsProps) {
  const { t } = useTranslation()

  const totalProducts = products.length
  const lowStockItems = products.filter((p) => p.stock_qty <= (p.reorder_level || 5))
  const totalStockUnits = products.reduce((sum, p) => sum + (p.stock_qty || 0), 0)
  const totalCostValue = products.reduce((sum, p) => sum + (p.cost_price || 0) * (p.stock_qty || 0), 0)

  return (
    <StatsGrid>
      <StatCard
        title={t('nav.products')}
        value={formatNumber(totalProducts)}
        icon={Package}
        color="emerald"
        tag={{ text: t('products.activeCatalog'), color: 'emerald' }}
      />

      <StatCard
        title={t('products.lowStockAlerts')}
        value={formatNumber(lowStockItems.length)}
        icon={AlertTriangle}
        color="amber"
        tag={{
          text: t('products.needsReorder'),
          color: lowStockItems.length > 0 ? 'amber' : 'gray',
        }}
      />

      <StatCard
        title={t('products.totalQuantity')}
        value={formatNumber(totalStockUnits)}
        icon={Boxes}
        color="blue"
        tag={{ text: t('products.itemsInHand'), color: 'blue' }}
      />

      <StatCard
        title={t('products.stockValueCost')}
        value={formatCurrency(totalCostValue)}
        icon={Coins}
        color="purple"
        tag={{ text: t('products.assetBasis'), color: 'purple' }}
      />
    </StatsGrid>
  )
}

export default ProductStats
