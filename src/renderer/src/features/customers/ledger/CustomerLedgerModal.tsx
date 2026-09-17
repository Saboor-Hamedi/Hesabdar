import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Search,
  Printer,
  Wallet,
  ShoppingBag,
  Coins,
} from 'lucide-react'
import type { Customer, Sale, CustomerPayment } from '../../../core/types'
import { getSales, getCustomerPayments } from '../../../core/store'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { formatCurrency } from '../../../core/utils/formatters'
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

  // Filter customers for the top quick-switcher (supports searching by name, phone, or invoice number)
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase().trim()
    const allSales = getSales()
    return allCustomers
      .filter((c) => {
        if (c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))) return true
        const cSales = allSales.filter((s) => s.customer_id === c.id)
        return cSales.some((s) => s.invoice_no?.toLowerCase().includes(q))
      })
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
        description: p.note || 'Debt settlement payment via Cashier',
        invoiced: 0,
        paid: p.amount,
      })
    })

    // Sort chronologically ascending
    rawList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Calculate true running balance without clamping to 0 (per suggestion.md)
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
        balance: Math.round(runningBalance * 100) / 100,
      }
    })

    // If customer has overpaid (paid > invoiced or runningBalance < 0), preserve the negative credit balance
    const netBalance = Math.round(runningBalance * 100) / 100

    return {
      entries: computedEntries,
      totalInvoiced: sumInvoiced,
      totalPaid: sumPaid,
      currentBalance: customer.balance !== undefined && customer.balance !== 0 ? customer.balance : netBalance,
    }
  }, [customer])

  if (!customer) return null

  // Format short date e.g. "17 Sep, 14:26"
  const formatShortDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      const day = d.getDate()
      const month = d.toLocaleString('en-US', { month: 'short' })
      const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      return `${day} ${month}, ${time}`
    } catch {
      return dateStr
    }
  }

  const isOverpaid = currentBalance < 0
  const isSettled = currentBalance === 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('customers.statementLedger', 'Customer Statement Ledger')}
      subtitle={`Complete financial history and chronological statement for ${customer.name}`}
      badge={
        <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 shadow-2xs">
          CUST-{String(1000 + customer.id)}
        </span>
      }
      style={{ width: '960px', height: '720px', maxWidth: '95vw', maxHeight: '92vh' }}
      className="flex flex-col"
      bodyClassName="flex-1 flex flex-col p-6 overflow-y-auto"
    >
      <div className="flex flex-col justify-between h-full gap-3.5">
        {/* Top Header & Customer Quick Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200/80 rounded-[8px] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#4A7C6F]/15 text-[#2D7A66] flex items-center justify-center font-bold text-sm border border-[#4A7C6F]/20">
              {customer.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900">{customer.name}</span>
                {customer.phone ? (
                  <a
                    href={`tel:${customer.phone}`}
                    className="text-[10px] font-mono text-gray-600 bg-white border border-gray-200 px-1.5 py-0.5 rounded-[4px] hover:text-[#2D7A66] hover:border-[#4A7C6F]/40 transition-colors"
                    title="Click to call / SMS customer"
                  >
                    📞 {customer.phone}
                  </a>
                ) : (
                  <span className="text-[10px] font-mono text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded-[4px]">
                    No phone
                  </span>
                )}
              </div>
              {customer.address && (
                <span className="text-[11px] text-gray-500 block mt-0.5">{customer.address}</span>
              )}
            </div>
          </div>

          {/* Search quick customer switcher (name/phone/invoice) */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Switch customer (search name, phone, INV)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 px-2 ps-7 text-[11px] border border-gray-200 rounded-[6px] bg-white text-gray-800 focus:outline-none focus:border-[#4A7C6F]"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute start-2 top-2.5 pointer-events-none" />

            {filteredCustomers.length > 0 && (
              <div className="absolute z-50 start-0 end-0 mt-1 bg-white border border-gray-200 rounded-[8px] shadow-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
                {filteredCustomers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectCustomer(c)
                      setSearchQuery('')
                    }}
                    className="p-2 hover:bg-[#4A7C6F]/10 text-xs cursor-pointer flex justify-between items-center transition-colors"
                  >
                    <span className="font-semibold text-gray-800">{c.name}</span>
                    <span className="text-[10px] font-mono text-gray-500">
                      Balance: {formatCurrency(c.balance || 0)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3 Primary Financial KPI Cards with Debt Logic Fix per suggestion.md */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
          {/* Card 1: Total Invoiced */}
          <div className="p-3 rounded-[8px] bg-white border border-gray-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-500 block font-semibold uppercase tracking-wider">
                {t('customers.totalInvoiced')}
              </span>
              <span className="text-base font-bold font-mono text-gray-900 mt-1 block">
                {formatCurrency(totalInvoiced)}
              </span>
            </div>
            <div className="w-9 h-9 rounded-[6px] bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <ShoppingBag className="w-4.5 h-4.5" />
            </div>
          </div>

          {/* Card 2: Total Debt Paid */}
          <div className="p-3 rounded-[8px] bg-white border border-gray-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-500 block font-semibold uppercase tracking-wider">
                {t('customers.totalPaid')}
              </span>
              <span className="text-base font-bold font-mono text-emerald-700 mt-1 block">
                {formatCurrency(totalPaid)}
              </span>
            </div>
            <div className="w-9 h-9 rounded-[6px] bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <Coins className="w-4.5 h-4.5" />
            </div>
          </div>

          {/* Card 3: Remaining Due / Credit Balance (Prominent & Color-coded per suggestion.md) */}
          <div
            className={`p-3 rounded-[8px] shadow-xs flex items-center justify-between border ${
              isOverpaid
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                : isSettled
                  ? 'bg-gray-50 border-gray-200 text-gray-800'
                  : 'bg-rose-50/80 border-rose-300 text-rose-950'
            }`}
          >
            <div>
              <span
                className={`text-[10px] block font-bold uppercase tracking-wider ${
                  isOverpaid
                    ? 'text-emerald-800'
                    : isSettled
                      ? 'text-gray-500'
                      : 'text-rose-800'
                }`}
              >
                {isOverpaid ? 'Credit Balance (طلب مشتری)' : isSettled ? 'Account Settled (تصفیه)' : t('customers.remainingDue')}
              </span>
              <span
                className={`text-xl font-black font-mono mt-1 block ${
                  isOverpaid
                    ? 'text-emerald-800'
                    : isSettled
                      ? 'text-gray-900'
                      : 'text-rose-700'
                }`}
              >
                {isOverpaid
                  ? `+${formatCurrency(Math.abs(currentBalance))}`
                  : formatCurrency(currentBalance)}
              </span>
              <span
                className={`text-[10px] font-medium ${
                  isOverpaid ? 'text-emerald-700' : isSettled ? 'text-gray-400' : 'text-rose-600'
                }`}
              >
                {isOverpaid ? 'Customer has store credit' : isSettled ? 'Zero outstanding debt' : 'Pending payment debt'}
              </span>
            </div>
            <div
              className={`w-9 h-9 rounded-[6px] flex items-center justify-center border ${
                isOverpaid
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : isSettled
                    ? 'bg-gray-100 text-gray-600 border-gray-200'
                    : 'bg-rose-100 text-rose-800 border-rose-200'
              }`}
            >
              <Wallet className="w-4.5 h-4.5" />
            </div>
          </div>
        </div>

        {/* Tab Switcher: Interactive Ledger Table vs Printable Statement */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] transition-all cursor-pointer ${
                activeTab === 'ledger'
                  ? 'bg-[#4A7C6F] text-white shadow-2xs font-bold'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('customers.statementLedger')} ({entries.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('print')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[6px] border transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'print'
                  ? 'bg-gray-900 text-white border-gray-900 shadow-2xs font-bold'
                  : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50 shadow-2xs'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              {t('customers.printableStatement')}
            </button>
          </div>

          <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">
            Khair Khana Commercial Credit Ledger
          </span>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'ledger' ? (
            <div className="border border-gray-200/80 rounded-[8px] overflow-hidden bg-white shadow-xs">
              <table className="w-full text-start border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-700 font-semibold text-[11px]">
                    <th className="p-2.5 text-start w-32">{t('table.dateTime')}</th>
                    <th className="p-2.5 text-start w-32">{t('table.invoice')} / Type</th>
                    <th className="p-2.5 text-start">{t('products.name')} &amp; Details</th>
                    <th className="p-2.5 text-end w-28">{t('table.total')} (+)</th>
                    <th className="p-2.5 text-end w-28">{t('sold.paidCash')} (-)</th>
                    <th className="p-2.5 text-end w-32">{t('customers.balance')}</th>
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
                          idx % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'
                        }`}
                      >
                        <td className="p-2.5 text-gray-500 font-mono text-[10px] whitespace-nowrap">
                          {formatShortDate(entry.date)}
                        </td>
                        <td className="py-3 px-2.5 font-sans">
                          <span
                            className={`text-[10px] font-medium font-mono px-2 py-0.5 rounded ${
                              entry.type === 'payment'
                                ? 'bg-emerald-50 text-emerald-800'
                                : entry.type === 'sale_credit'
                                  ? 'bg-amber-50 text-amber-800'
                                  : 'bg-blue-50 text-blue-800'
                            }`}
                          >
                            {entry.refNo}
                          </span>
                        </td>
                        <td className="py-3 px-2.5 font-sans text-gray-800">
                          <div
                            className="max-w-[260px] truncate"
                            title={entry.description}
                          >
                            {entry.type === 'payment' && (
                              <Wallet className="w-3.5 h-3.5 text-emerald-600 inline me-1.5 shrink-0" />
                            )}
                            {entry.description}
                          </div>
                        </td>
                        <td className="py-3 px-2.5 text-end text-gray-900 font-semibold font-mono">
                          {entry.invoiced > 0 ? formatCurrency(entry.invoiced) : '—'}
                        </td>
                        <td className="py-3 px-2.5 text-end text-emerald-700 font-semibold font-mono">
                          {entry.paid > 0 ? formatCurrency(entry.paid) : '—'}
                        </td>
                        <td className="py-3 px-2.5 text-end font-bold font-mono">
                          {entry.balance > 0 ? (
                            <span className="text-rose-700">+{formatCurrency(entry.balance)}</span>
                          ) : entry.balance < 0 ? (
                            <span className="text-emerald-700">-{formatCurrency(Math.abs(entry.balance))}</span>
                          ) : (
                            <span className="text-gray-400 font-medium">0 AFN</span>
                          )}
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

        {/* Modal Actions Footer: Audit Trail per suggestion.md */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <span>
              Statement Generated:{' '}
              <strong className="font-mono text-gray-800">
                {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })},{' '}
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </strong>
            </span>
            <span>•</span>
            <span className="text-gray-400">{entries.length} Ledger Audits</span>
          </div>

          <div className="flex items-center gap-2">
            {currentBalance > 0 && (
              <Button
                variant="primary"
                onClick={() => onOpenReceivePayment(customer)}
                icon={<Wallet className="w-3.5 h-3.5" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 cursor-pointer"
              >
                {t('customers.receivePayment')} ({formatCurrency(currentBalance)})
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
