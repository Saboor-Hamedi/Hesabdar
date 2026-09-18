import { useTranslation } from 'react-i18next'
import { Calendar, Package, Eye, Printer, Trash2 } from 'lucide-react'
import type { Sale, Customer } from '../../../core/types'
import { DataTable, type Column } from '../../../components/ui/DataTable'
import { formatCurrency, formatDateTime } from '../../../core/utils/formatters'

interface SoldTableProps {
  sales: Sale[]
  customers: Customer[]
  onViewReceipt: (sale: Sale) => void
  onDirectPrint?: (sale: Sale) => void
  onVoidSale: (id: number) => void
}

/**
 * SoldTable: Interactive list of sales transactions with invoice details and void action.
 */
export function SoldTable({
  sales,
  customers,
  onViewReceipt,
  onDirectPrint,
  onVoidSale,
}: SoldTableProps) {
  const { t } = useTranslation()

  const columns: Column<Sale>[] = [
    {
      key: 'invoice_no',
      header: t('table.invoice'),
      sortable: true,
      render: (row) => {
        const cust = row.customer_id ? customers.find((c) => c.id === row.customer_id) : null
        return (
          <div className="flex flex-col">
            <span className="font-mono font-semibold text-gray-800 text-xs">{row.invoice_no}</span>
            {cust && (
              <span className="text-[10px] text-emerald-700 font-medium truncate max-w-[140px]">
                {cust.name}
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'created_at',
      header: t('table.dateTime'),
      sortable: true,
      render: (row) => (
        <span className="text-gray-500 text-[11px] flex items-center gap-1">
          <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
          {formatDateTime(row.created_at)}
        </span>
      ),
    },
    {
      key: 'payment_mode',
      header: t('table.payment'),
      render: (row) => {
        const isCash = row.payment_mode === 'cash'
        const isCard = row.payment_mode === 'card'
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-bold tracking-wide uppercase ${
              isCash
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : isCard
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            {isCash ? 'Cash' : isCard ? 'Card' : 'Credit'}
          </span>
        )
      },
    },
    {
      key: 'items',
      header: t('nav.products'),
      render: (row) => (
        <div className="flex flex-col text-xs">
          <span className="text-gray-700 font-medium flex items-center gap-1">
            <Package className="w-3 h-3 text-gray-400" />
            {row.items?.length || 0} items
          </span>
          <span className="text-[10px] text-gray-400 truncate max-w-[200px]">
            {row.items?.map((it) => `${it.product_name || 'Product'} (${it.qty} ${it.unit || 'pcs'})`).join(', ')}
          </span>
        </div>
      ),
    },
    {
      key: 'subtotal',
      header: t('pos.subtotal'),
      align: 'end',
      sortable: true,
      render: (row) => <span className="font-mono text-gray-600 text-xs">{formatCurrency(row.subtotal)}</span>,
    },
    {
      key: 'discount',
      header: t('pos.discount'),
      align: 'end',
      render: (row) => (
        <span className={`font-mono text-xs ${row.discount > 0 ? 'text-rose-600 font-medium' : 'text-gray-400'}`}>
          {row.discount > 0 ? `-${formatCurrency(row.discount)}` : '0'}
        </span>
      ),
    },
    {
      key: 'total',
      header: t('common.total'),
      align: 'end',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-emerald-700 text-xs">
          {formatCurrency(row.total)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => onViewReceipt(row)}
            title={t('sold.invoiceDetails')}
            className="p-1.5 rounded-[5px] text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {onDirectPrint && (
            <button
              type="button"
              onClick={() => onDirectPrint(row)}
              title="Print (1-Click)"
              className="p-1.5 rounded-[5px] text-gray-500 hover:text-[#2F6153] hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onVoidSale(row.id)}
            title={t('sold.voidSale')}
            className="p-1.5 rounded-[5px] text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <DataTable<Sale>
      columns={columns}
      data={sales}
      rowKey={(s) => s.id}
      searchable
      searchFields={['invoice_no', 'customer_name', 'customer_phone', 'payment_mode']}
      searchPlaceholder={t('sold.searchPlaceholder')}
      pageSize={10}
    />
  )
}
