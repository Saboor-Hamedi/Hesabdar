import { useTranslation } from 'react-i18next'
import { Phone, Building, Wallet, Trash2 } from 'lucide-react'
import type { Supplier } from '../../../core/types'
import { DataTable, type Column } from '../../../components/ui/DataTable'
import { formatCurrency, formatDateTime } from '../../../core/utils/formatters'

interface SuppliersTableProps {
  suppliers: Supplier[]
  onOpenPaymentModal: (supplier: Supplier) => void
  onDeleteSupplier: (id: number) => void
}

/**
 * SuppliersTable: Interactive vendor ledger with payment dispatch action and removal.
 */
export function SuppliersTable({
  suppliers,
  onOpenPaymentModal,
  onDeleteSupplier,
}: SuppliersTableProps) {
  const { t } = useTranslation()

  const columns: Column<Supplier>[] = [
    {
      key: 'name',
      header: t('suppliers.name'),
      sortable: true,
      render: (s) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800">{s.name}</span>
          {s.company && (
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              <Building className="w-2.5 h-2.5" />
              {s.company}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'phone',
      header: t('suppliers.phone'),
      render: (s) => (
        <span className="font-mono text-gray-600 flex items-center gap-1 text-xs">
          {s.phone ? (
            <>
              <Phone className="w-3 h-3 text-gray-400" />
              {s.phone}
            </>
          ) : (
            '—'
          )}
        </span>
      ),
    },
    {
      key: 'balance',
      header: t('suppliers.balance'),
      align: 'end',
      sortable: true,
      render: (s) => {
        const hasBalance = (s.balance || 0) > 0
        return (
          <div className="flex items-center justify-end gap-2">
            <span
              className={`font-mono text-xs font-bold ${
                hasBalance ? 'text-amber-700' : 'text-gray-500'
              }`}
            >
              {formatCurrency(s.balance || 0)}
            </span>
            {hasBalance && (
              <button
                type="button"
                onClick={() => onOpenPaymentModal(s)}
                className="px-2 py-0.5 rounded-[5px] text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1 transition-colors cursor-pointer"
                title="Pay Supplier"
              >
                <Wallet className="w-3 h-3 text-emerald-600" />
                <span>Pay</span>
              </button>
            )}
          </div>
        )
      },
    },
    {
      key: 'created_at',
      header: t('suppliers.registered'),
      render: (s) => (
        <span className="text-gray-400 text-[11px]">{formatDateTime(s.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      align: 'center',
      render: (s) => (
        <button
          type="button"
          onClick={() => onDeleteSupplier(s.id)}
          className="p-1 rounded-[5px] text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ]

  return (
    <DataTable<Supplier>
      columns={columns}
      data={suppliers}
      rowKey={(s) => s.id}
      searchable
      searchFields={['name', 'company', 'phone']}
      searchPlaceholder={t('suppliers.searchPlaceholder')}
      pageSize={10}
    />
  )
}
