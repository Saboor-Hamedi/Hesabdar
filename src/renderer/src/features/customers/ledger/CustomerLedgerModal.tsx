import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Search,
  Printer,
  Wallet,
  ShoppingBag,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react'
import type { Customer, Sale, CustomerPayment } from '../../../core/types'
import { getSales, getCustomerPayments } from '../../../core/store'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { formatCurrency, formatDateTime } from '../../../core/utils/formatters'
import { CustomerStatementPrint, type LedgerEntry } from './CustomerStatementPrint'

interface CustomerLedgerModalProps {
  customer: Customer | null
  allCustomers: Customer[]
  isOpen: boolean
  onClose: () => void
  onSelectCustomer: (customer: Customer) => void
  onOpenReceivePayment: (customer: Customer) => void
}

/**
 * CustomerLedgerModal: Executive 900x700px ledger statement modal.
 * Itemizes all invoices, payments, and running balance with print preview.
 */
export function CustomerLedgerModal({
  customer,
  allCustomers,
  isOpen,
  onClose,
  onSelectCustomer,
  onOpenReceivePayment,
}: CustomerLedgerModalProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'ledger' | 'print'>('ledger')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter customers for the top quick-switcher
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase().trim()
    return allCustomers
      .filter((c) => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)))
      .slice(0, 5)
  }, [allCustomers, searchQuery])

  // Retrieve sales & customer payments for the selected customer
  const { entries, totalInvoiced, totalPaid, currentBalance } = useMemo(() => {
    if (!customer) {
      return { entries: [], totalInvoiced: 0, totalPaid: 0, currentBalance: 0 }
    }

    const allSales: Sale[] = getSales()
    const customerSales = allSales.filter((s) => s.customer_id === customer.id)
    const customerPayments: CustomerPayment[] = getCustomerPayments(customer.id)

    const rawList: Array<{
      id: string
      date: string
      type: 'sale_credit' | 'sale_cash' | 'payment'
      refNo: string
      description: string
      invoiced: number
      paid: number
    }> = []

    // Map Sales
    customerSales.forEach((s) => {
      const isCredit = s.payment_mode === 'credit'
      const itemSummary =
        s.items && s.items.length > 0
          ? s.items.map((it) => `${it.qty}x ${it.product_name}`).join(', ')
          : 'Invoice items'

      rawList.push({
        id: `sale-${s.id}`,
        date: s.created_at,
        type: isCredit ? 'sale_credit' : 'sale_cash',
        refNo: `${s.invoice_no} (${s.payment_mode.toUpperCase()})`,
        description: itemSummary,
        invoiced: s.total,
        paid: s.paid,
      })
    })

    // Map Payments
    customerPayments.forEach((p) => {
      rawList.push({
        id: `pay-${p.id}`,
        date: p.created_at,
        type: 'payment',
        refNo: `REC-${p.id}`,
        description: p.note || 'Debt settlement payment',
        invoiced: 0,
        paid: p.amount,
      })
    })

    // Sort chronologically ascending
    rawList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Calculate running balance
    let runningBalance = 0
    let sumInvoiced = 0
    let sumPaid = 0

    const computedEntries: LedgerEntry[] = rawList.map((item) => {
      sumInvoiced += item.invoiced
      sumPaid += item.paid
      // Credit adds to debt, payment subtracts from debt
      if (item.type === 'sale_credit') {
        const debtAddition = item.invoiced - item.paid
        runningBalance += debtAddition
      } else if (item.type === 'payment') {
        runningBalance -= item.paid
      }
      // If cash sale, debt doesn't change

      return {
        ...item,
        balance: Math.max(0, Math.round(runningBalance * 100) / 100),
      }
    })

    return {
      entries: computedEntries,
      totalInvoiced: sumInvoiced,
      totalPaid: sumPaid,
      currentBalance: customer.balance || Math.max(0, runningBalance),
    }
  }, [customer])

  if (!customer) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('customers.statementLedger')}
      subtitle={`Complete financial history and purchasing statement for ${customer.name}`}
      style={{ width: '900px', height: '700px', maxWidth: '95vw', maxHeight: '92vh' }}
      className="flex flex-col"
      bodyClassName="flex-1 flex flex-col p-5 overflow-y-auto"
    >
      <div className="flex flex-col justify-between h-full gap-3.5">
        {/* Top Header & Customer Quick Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200/90 rounded-[5px] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[5px] bg-emerald-100/70 text-emerald-800 flex items-center justify-center font-bold text-sm">
              {customer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900">{customer.name}</span>
                <span className="text-[10px] font-mono text-gray-500 bg-white border border-gray-200 px-1.5 py-0.2 rounded">
                  {customer.phone || 'No phone'}
                </span>
              </div>
              {customer.address && (
                <span className="text-[11px] text-gray-500 block mt-0.5">{customer.address}</span>
              )}
            </div>
          </div>

          {/* Search quick customer switcher */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Switch customer (search name/phone)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-7 px-2 ps-7 text-[11px] border border-gray-300 rounded-[5px] bg-white text-gray-800 focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-3 h-3 text-gray-400 absolute start-2 top-2 pointer-events-none" />

            {filteredCustomers.length > 0 && (
              <div className="absolute z-50 start-0 end-0 mt-1 bg-white border border-gray-200 rounded-[5px] shadow-lg max-h-40 overflow-y-auto divide-y divide-gray-100">
                {filteredCustomers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectCustomer(c)
                      setSearchQuery('')
                    }}
                    className="p-1.5 hover:bg-emerald-50 text-xs cursor-pointer flex justify-between items-center"
                  >
                    <span className="font-semibold text-gray-800">{c.name}</span>
                    <span className="text-[10px] font-mono text-gray-500">
                      Debt: {formatCurrency(c.balance || 0)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3 Primary Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
          <div className="p-3 rounded-[5px] bg-white border border-gray-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 block font-medium uppercase">
                {t('customers.totalInvoiced')}
              </span>
              <span className="text-base font-bold font-mono text-gray-900 mt-0.5 block">
                {formatCurrency(totalInvoiced)}
              </span>
              <span className="text-[10px] text-gray-500">AFN</span>
            </div>
            <div className="w-8 h-8 rounded-[5px] bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 rounded-[5px] bg-white border border-gray-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 block font-medium uppercase">
                {t('customers.totalPaid')}
              </span>
              <span className="text-base font-bold font-mono text-emerald-700 mt-0.5 block">
                {formatCurrency(totalPaid)}
              </span>
              <span className="text-[10px] text-emerald-600">AFN</span>
            </div>
            <div className="w-8 h-8 rounded-[5px] bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>

          <div className="p-3 rounded-[5px] bg-amber-50/60 border border-amber-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] text-amber-800 block font-bold uppercase">
                {t('customers.remainingDue')}
              </span>
              <span className="text-base font-black font-mono text-amber-950 mt-0.5 block">
                {formatCurrency(currentBalance)}
              </span>
              <span className="text-[10px] text-amber-700">AFN</span>
            </div>
            <div className="w-8 h-8 rounded-[5px] bg-amber-100 text-amber-800 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Tab Switcher: Interactive Ledger Table vs Printable Statement */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1 text-xs font-semibold rounded-[5px] transition-colors cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t('customers.statementLedger')} ({entries.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('print')}
            className={`px-3 py-1 text-xs font-semibold rounded-[5px] transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'print'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Printer className="w-3 h-3" />
            {t('customers.printableStatement')}
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'ledger' ? (
            <div className="border border-gray-200/90 rounded-[5px] overflow-hidden bg-white shadow-xs">
              <table className="w-full text-start border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold text-[11px]">
                    <th className="p-2.5 text-start w-36">{t('table.dateTime')}</th>
                    <th className="p-2.5 text-start w-28">{t('table.invoice')} / Type</th>
                    <th className="p-2.5 text-start">{t('products.name')} &amp; Details</th>
                    <th className="p-2.5 text-end w-24">{t('table.total')} (+)</th>
                    <th className="p-2.5 text-end w-24">{t('sold.paidCash')} (-)</th>
                    <th className="p-2.5 text-end w-28">{t('customers.balance')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400 font-sans">
                        No purchases or payments on record for this customer.
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry, idx) => (
                      <tr
                        key={entry.id || idx}
                        className={`hover:bg-gray-50/80 transition-colors ${
                          idx % 2 === 1 ? 'bg-gray-50/30' : 'bg-white'
                        }`}
                      >
                        <td className="p-2.5 text-gray-500 font-mono text-[10px]">
                          {formatDateTime(entry.date)}
                        </td>
                        <td className="p-2.5 font-sans">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-1 ${
                              entry.type === 'payment'
                                ? 'bg-emerald-100 text-emerald-800'
                                : entry.type === 'sale_credit'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-blue-100 text-blue-900'
                            }`}
                          >
                            {entry.type === 'payment' ? (
                              <ArrowDownLeft className="w-2.5 h-2.5 text-emerald-700" />
                            ) : (
                              <ArrowUpRight className="w-2.5 h-2.5 text-amber-700" />
                            )}
                            {entry.refNo}
                          </span>
                        </td>
                        <td className="p-2.5 font-sans text-gray-800">
                          {entry.description}
                        </td>
                        <td className="p-2.5 text-end text-gray-900 font-semibold">
                          {entry.invoiced > 0 ? formatCurrency(entry.invoiced) : '—'}
                        </td>
                        <td className="p-2.5 text-end text-emerald-700 font-semibold">
                          {entry.paid > 0 ? formatCurrency(entry.paid) : '—'}
                        </td>
                        <td className="p-2.5 text-end font-bold text-amber-800">
                          {formatCurrency(entry.balance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <CustomerStatementPrint
              customer={customer}
              entries={entries}
              totalInvoiced={totalInvoiced}
              totalPaid={totalPaid}
              currentBalance={currentBalance}
            />
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {t('customers.outstandingDebt')}: <strong className="font-mono text-amber-800">{formatCurrency(currentBalance)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {currentBalance > 0 && (
              <Button
                variant="primary"
                onClick={() => onOpenReceivePayment(customer)}
                icon={<Wallet className="w-3.5 h-3.5" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs"
              >
                {t('customers.receivePayment')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
