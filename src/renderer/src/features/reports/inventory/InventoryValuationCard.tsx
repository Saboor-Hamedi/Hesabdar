import { Package, Download, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Product } from '../../../core/types'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { formatCurrency, formatNumber } from '../../../core/utils/formatters'
import { notify } from '../../../core/notifications'

interface InventoryValuationCardProps {
  products: Product[]
}

/**
 * InventoryValuationCard: Live valuation of stock assets, retail turnover value, and CSV export.
 */
export function InventoryValuationCard({ products }: InventoryValuationCardProps) {
  const { t } = useTranslation()
  const totalCost = products.reduce((sum, p) => sum + (p.cost_price || 0) * (p.stock_qty || 0), 0)
  const totalRetail = products.reduce((sum, p) => sum + (p.sell_price || 0) * (p.stock_qty || 0), 0)
  const potentialProfit = Math.max(0, totalRetail - totalCost)
  const totalUnits = products.reduce((sum, p) => sum + (p.stock_qty || 0), 0)

  const handleExportInventoryCSV = () => {
    if (products.length === 0) {
      notify({
        type: 'warning',
        title: 'Empty Catalog',
        message: 'No inventory items available to export.',
      })
      return
    }

    const headers = [
      'ID',
      'Barcode',
      'Persian Name',
      'English Name',
      'Pashto Name',
      'Category',
      'Unit',
      'Cost Price (AFN)',
      'Sell Price (AFN)',
      'Stock Qty',
      'Total Cost Basis',
      'Total Retail Value',
    ]

    const rows = products.map((p) => [
      p.id,
      p.barcode ? `"${p.barcode}"` : '""',
      `"${p.name_fa || ''}"`,
      `"${p.name_en || ''}"`,
      `"${p.name_ps || ''}"`,
      `"${p.category_name || 'General'}"`,
      p.unit,
      p.cost_price,
      p.sell_price,
      p.stock_qty,
      (p.cost_price * p.stock_qty).toFixed(2),
      (p.sell_price * p.stock_qty).toFixed(2),
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `hesabdar_inventory_valuation_${new Date().toISOString().slice(0, 10)}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    notify({
      type: 'success',
      title: 'CSV Exported',
      message: 'Inventory valuation report downloaded successfully.',
    })
  }

  return (
    <Card
      title={t('reports.inventoryValuation')}
      subtitle={t('reports.inventoryValuationSubtitle')}
    >
      <div className="flex flex-col gap-3 py-1">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-2.5 rounded-[5px] bg-gray-50 border border-gray-100">
            <span className="text-[10px] text-gray-400 block font-medium">{t('reports.inStockUnits')}</span>
            <span className="font-mono text-sm font-bold text-gray-900 mt-0.5 block">
              {formatNumber(totalUnits)}
            </span>
            <span className="text-[10px] text-gray-500">{products.length} {t('products.title')}</span>
          </div>

          <div className="p-2.5 rounded-[5px] bg-purple-50/50 border border-purple-100">
            <span className="text-[10px] text-purple-700 block font-medium">{t('reports.totalCostValue')}</span>
            <span className="font-mono text-sm font-bold text-purple-900 mt-0.5 block">
              {formatCurrency(totalCost)}
            </span>
            <span className="text-[10px] text-purple-600 font-medium">AFN</span>
          </div>

          <div className="p-2.5 rounded-[5px] bg-blue-50/50 border border-blue-100">
            <span className="text-[10px] text-blue-700 block font-medium">{t('reports.projectedRetailValue')}</span>
            <span className="font-mono text-sm font-bold text-blue-900 mt-0.5 block">
              {formatCurrency(totalRetail)}
            </span>
            <span className="text-[10px] text-blue-600 font-medium">AFN</span>
          </div>

          <div className="p-2.5 rounded-[5px] bg-emerald-50/50 border border-emerald-100">
            <span className="text-[10px] text-emerald-700 block font-medium">{t('reports.projectedGrossGain')}</span>
            <span className="font-mono text-sm font-bold text-emerald-900 mt-0.5 block flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              {formatCurrency(potentialProfit)}
            </span>
            <span className="text-[10px] text-emerald-700">
              {totalCost > 0 ? `${Math.round((potentialProfit / totalCost) * 100)}% ROI` : '0%'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-[11px] text-gray-400 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-gray-500" />
            {t('reports.inventoryValuationSubtitle')}
          </span>

          <Button
            variant="outline"
            onClick={handleExportInventoryCSV}
            icon={<Download className="w-3.5 h-3.5 text-gray-600" />}
          >
            {t('reports.exportStockCSV')}
          </Button>
        </div>
      </div>
    </Card>
  )
}
