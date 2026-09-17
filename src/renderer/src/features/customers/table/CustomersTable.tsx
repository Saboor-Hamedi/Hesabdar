import { useTranslation } from 'react-i18next'
import { Phone, MapPin, Wallet, Trash2, FileText, Pencil } from 'lucide-react'
import type { Customer } from '../../../core/types'
import { DataTable, type Column } from '../../../components/ui/DataTable'
import { formatCurrency, formatDateTime } from '../../../core/utils/formatters'

interface CustomersTableProps {
  customers: Customer[]
  onOpenPaymentModal: (customer: Customer) => void
  onOpenLedger: (customer: Customer) => void
  onEditCustomer: (customer: Customer) => void
  onDeleteCustomer: (id: number) => void
}

/**
 * CustomersTable: Customer accounts registry with debt collection action, statement, editing, and deletion.
 */
export function CustomersTable({
  customers,
  onOpenPaymentModal,
  onOpenLedger,
  onEditCustomer,
  onDeleteCustomer,
}: CustomersTableProps) {
  const { t } = useTranslation()

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: t('customers.name'),
      sortable: true,
      render: (c) => <span className="font-semibold text-gray-800">{c.name}</span>,
    },
    {
      key: 'phone',
      header: t('customers.phone'),
      render: (c) => (
        <span className="font-mono text-gray-600 flex items-center gap-1 text-xs">
          {c.phone ? (
            <>
              <Phone className="w-3 h-3 text-gray-400" />
              {c.phone}
            </>
          ) : (
            '—'
          )}
        </span>
      ),
    },
    {
      key: 'address',
      header: t('customers.address'),
      render: (c) => (
        <span className="text-gray-500 text-xs flex items-center gap-1">
          {c.address ? (
            <>
              <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
              {c.address}
            </>
          ) : (
            '—'
          )}
        </span>
      ),
    },
    {
      key: 'balance',
      header: t('customers.balance'),
      align: 'end',
      sortable: true,
      render: (c) => {
        const bal = c.balance || 0
        const hasDebt = bal > 0
        const hasCredit = bal < 0
        return (
          <div className="flex items-center justify-end gap-2">
            <span
              className={`font-mono text-xs font-bold ${
                hasDebt
                  ? 'text-amber-700'
                  : hasCredit
                    ? 'text-emerald-700'
                    : 'text-gray-500'
              }`}
            >
              {hasCredit ? `+${formatCurrency(Math.abs(bal))}` : formatCurrency(bal)}
            </span>
            {hasDebt && (
              <button
                type="button"
                onClick={() => onOpenPaymentModal(c)}
                className="px-2 py-0.5 rounded-[5px] text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1 transition-colors cursor-pointer"
                title={t('customers.receivePayment')}
              >
                <Wallet className="w-3 h-3 text-emerald-600" />
                <span>{t('customers.receive')}</span>
              </button>
            )}
            {hasCredit && (
              <span className="text-[10px] text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-1.5 py-0.5 rounded font-medium">
                {t('customers.creditCustomer')}
              </span>
            )}
            {bal === 0 && (
              <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-medium">
                {t('customers.settled')}
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'created_at',
      header: t('customers.registered'),
      render: (c) => (
        <span className="text-gray-400 text-[11px]">{formatDateTime(c.created_at)}</span>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      align: 'center',
      render: (c) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => onOpenLedger(c)}
            title="Account Statement & Purchasing History"
            className="p-1 rounded-[5px] text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onEditCustomer(c)}
            title="Edit Customer Profile & Balance"
            className="p-1 rounded-[5px] text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteCustomer(c.id)}
            title={t('common.delete')}
            className="p-1 rounded-[5px] text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <DataTable<Customer>
      columns={columns}
      data={customers}
      rowKey={(c) => c.id}
      searchable
      searchPlaceholder={t('customers.searchPlaceholder')}
      pageSize={10}
    />
  )
}
