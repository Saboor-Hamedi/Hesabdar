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
        <span className="font-mono text-gray-500 dark:text-slate-400 text-[11px]">{p.barcode || '—'}</span>
      ),
    },
    {
      key: 'name_fa',
      header: t('products.name'),
      sortable: true,
      render: (p) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-800 dark:text-slate-100">{p.name_fa}</span>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-slate-500">
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
        <span className="px-2 py-0.5 rounded-[5px] bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200/50 dark:border-slate-700 text-[10px] font-medium">
          {p.category_name || 'General'}
        </span>
      ),
    },
    {
      key: 'unit',
      header: t('products.unit'),
      align: 'center',
      render: (p) => <span className="text-[11px] text-gray-500 dark:text-slate-400 uppercase">{p.unit}</span>,
    },
    {
      key: 'cost_price',
      header: t('products.cost'),
      align: 'end',
      sortable: true,
      render: (p) => <span className="font-mono text-gray-600 dark:text-slate-300">{formatCurrency(p.cost_price)}</span>,
    },
    {
      key: 'sell_price',
      header: t('products.price'),
      align: 'end',
      sortable: true,
      render: (p) => (
        <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">{formatCurrency(p.sell_price)}</span>
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
                isLow ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60' : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 border border-gray-200/50 dark:border-slate-700'
              }`}
            >
              {isLow && <AlertTriangle className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />}
              {p.stock_qty}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => onAdjustStock(p.id, -1)}
                title="Decrease amount"
                className="w-5 h-5 flex items-center justify-center rounded-[5px] border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 text-xs transition-colors cursor-pointer"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => onAdjustStock(p.id, 1)}
                title="Increase amount"
                className="w-5 h-5 flex items-center justify-center rounded-[5px] border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 text-xs transition-colors cursor-pointer"
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
            className="p-1 rounded-[5px] text-gray-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onRemoveProduct(p.id)}
            title={t('common.delete')}
            className="p-1 rounded-[5px] text-gray-400 dark:text-slate-400 hover:text-red-600 dark:hover:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
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
      searchFields={['name_fa', 'name_en', 'name_ps', 'barcode', 'category_name']}
      searchPlaceholder={t('products.searchPlaceholder')}
      pageSize={10}
    />
  )
}
