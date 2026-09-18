import { useTranslation } from 'react-i18next'
import { AlertTriangle, Trash2, Pencil } from 'lucide-react'
import type { Product } from '../../../core/types'
import { DataTable, type Column } from '../../../components/ui/DataTable'
import { formatCurrency } from '../../../core/utils/formatters'

interface ProductsTableProps {
  products: Product[]
  onAdjustStock: (id: number, delta: number) => void
  onEditProduct: (product: Product) => void
  onRemoveProduct: (id: number) => void
}

/**
 * ProductsTable: Clean inventory data table with stock level adjustments, editing, and deletion.
 */
export function ProductsTable({
  products,
  onAdjustStock,
  onEditProduct,
  onRemoveProduct,
}: ProductsTableProps) {
  const { t } = useTranslation()

  const columns: Column<Product>[] = [
    {
      key: 'barcode',
      header: t('products.barcode'),
      sortable: true,
      render: (p) => (
        <span className="font-mono text-gray-500 text-[11px]">{p.barcode || '—'}</span>
      ),
    },
    {
      key: 'name_fa',
      header: t('products.name'),
      sortable: true,
      render: (p) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-800">{p.name_fa}</span>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            {p.name_en && <span>{p.name_en}</span>}
            {p.name_en && p.name_ps && <span>•</span>}
            {p.name_ps && <span>{p.name_ps}</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'category_name',
      header: t('products.category'),
      render: (p) => (
        <span className="px-2 py-0.5 rounded-[5px] bg-gray-100 text-gray-700 text-[10px] font-medium">
          {p.category_name || 'General'}
        </span>
      ),
    },
    {
      key: 'unit',
      header: t('products.unit'),
      align: 'center',
      render: (p) => <span className="text-[11px] text-gray-500 uppercase">{p.unit}</span>,
    },
    {
      key: 'cost_price',
      header: t('products.cost'),
      align: 'end',
      sortable: true,
      render: (p) => <span className="font-mono text-gray-600">{formatCurrency(p.cost_price)}</span>,
    },
    {
      key: 'sell_price',
      header: t('products.price'),
      align: 'end',
      sortable: true,
      render: (p) => (
        <span className="font-mono font-semibold text-emerald-700">{formatCurrency(p.sell_price)}</span>
      ),
    },
    {
      key: 'stock_qty',
      header: t('products.stock'),
      align: 'end',
      sortable: true,
      render: (p) => {
        const isLow = p.stock_qty <= (p.reorder_level || 5)
        return (
          <div className="flex items-center justify-end gap-1.5">
            <span
              className={`font-mono font-medium px-2 py-0.5 rounded-[5px] text-[11px] inline-flex items-center gap-1 ${
                isLow ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {isLow && <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />}
              {p.stock_qty}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => onAdjustStock(p.id, -1)}
                title="Decrease amount"
                className="w-5 h-5 flex items-center justify-center rounded-[5px] border border-gray-200 hover:bg-gray-100 text-gray-600 text-xs transition-colors cursor-pointer"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => onAdjustStock(p.id, 1)}
                title="Increase amount"
                className="w-5 h-5 flex items-center justify-center rounded-[5px] border border-gray-200 hover:bg-gray-100 text-gray-600 text-xs transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        )
      },
    },
    {
      key: 'actions',
      header: t('common.actions'),
      align: 'center',
      render: (p) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => onEditProduct(p)}
            title="Edit product details & prices"
            className="p-1 rounded-[5px] text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onRemoveProduct(p.id)}
            title={t('common.delete')}
            className="p-1 rounded-[5px] text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <DataTable<Product>
      columns={columns}
      data={products}
      rowKey={(p) => p.id}
      searchable
      searchPlaceholder={t('products.searchPlaceholder')}
      pageSize={10}
    />
  )
}
