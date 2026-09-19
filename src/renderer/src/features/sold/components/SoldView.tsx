import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Receipt, Calendar } from 'lucide-react'
import { getSales, deleteSale, getCustomers, onStoreChange } from '../../../core/store'
import type { Sale, Customer } from '../../../core/types'
import { PageHeader } from '../../../components/layout/PageHeader'
import { SoldMetrics } from '../metrics/SoldMetrics'
import { SoldTable } from '../table/SoldTable'
import { InvoiceModal } from '../details/InvoiceModal'
import { useCalendarFilter } from '../../../core/calendar/calendarContext'
import { notify } from '../../../core/notifications'
import { detectBestPrinter } from '../../../core/utils/printerDetection'

/**
 * SoldView: Cleanly decomposed view for managing all completed customer invoices and sold items.
 * Standardized with full-viewport layout, sticky table headers, and fixed pagination.
 */
export function SoldView() {
  const { t } = useTranslation()
  const { isDateInRange, activePreset } = useCalendarFilter()
  const [sales, setSales] = useState<Sale[]>(() => getSales())
  const [customers, setCustomers] = useState<Customer[]>(() => getCustomers())
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [filterByCalendar, setFilterByCalendar] = useState(false)

  // Subscribe to real-time sales and customer updates
  useEffect(() => {
    setSales(getSales())
    setCustomers(getCustomers())
    const unsubscribe = onStoreChange(() => {
      setSales(getSales())
      setCustomers(getCustomers())
    })
    return unsubscribe
  }, [])

  // Filter sales based on active header date range if enabled
  const displayedSales = useMemo(() => {
    if (!filterByCalendar) return sales
    return sales.filter((s) => isDateInRange(s.created_at))
  }, [sales, filterByCalendar, isDateInRange])

  // Handle viewing invoice receipt
  const handleViewReceipt = (sale: Sale) => {
    setSelectedSale(sale)
    setIsReceiptOpen(true)
  }

  // Handle direct 1-click print without modal
  const handleDirectPrint = async (sale: Sale) => {
    try {
      if (window.api?.print) {
        const rawList = await window.api.print.getPrinters()
        const detected = detectBestPrinter(rawList || [])
        const res = await window.api.print.direct({
          deviceName: detected.selectedName || undefined,
          silent: true,
        })
        if (res && res.success === false) {
          notify({
            type: 'error',
            title: 'Print Notice',
            message: res.failureReason || 'Failed to send to printer.',
          })
        } else {
          notify({
            type: 'success',
            title: 'Sent to Printer',
            message: `Invoice #${sale.invoice_no} printed to ${detected.selectedName || 'Default Printer'}`,
          })
        }
      } else {
        setSelectedSale(sale)
        setIsReceiptOpen(true)
      }
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Print Error',
        message: err?.message || 'Failed to print.',
      })
    }
  }

  // Handle voiding / deleting sale
  const handleVoidSale = (id: number) => {
    if (window.confirm(t('sold.confirmVoid'))) {
      deleteSale(id, true)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 gap-3.5 max-w-7xl mx-auto w-full select-none">
      {/* Unified Page Header */}
      <PageHeader
        title={t('sold.title')}
        subtitle={t('sold.subtitle')}
        icon={Receipt}
        action={
          <button
            type="button"
            onClick={() => setFilterByCalendar((prev) => !prev)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border cursor-pointer
              ${
                filterByCalendar
                  ? 'bg-[#2F6153] dark:bg-[#4A7C6F] text-white border-[#2F6153] dark:border-[#4A7C6F] shadow-xs ring-2 ring-[#7CAE9F]/30'
                  : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-700 shadow-2xs'
              }
            `}
            title="Filter invoices by Titlebar Calendar range"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {filterByCalendar ? `Filtered: ${activePreset}` : 'Filter by Calendar'}
            </span>
            {filterByCalendar && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold font-mono">
                {displayedSales.length}
              </span>
            )}
          </button>
        }
      />

      {/* 1. Standardized KPI Metric Summary Cards */}
      <SoldMetrics sales={displayedSales} />

      {/* 2. Full-Viewport Sticky Invoices Data Table */}
      <div className="flex-1 min-h-0 flex flex-col mt-1">
        <SoldTable
          sales={displayedSales}
          customers={customers}
          onViewReceipt={handleViewReceipt}
          onDirectPrint={handleDirectPrint}
          onVoidSale={handleVoidSale}
        />
      </div>

      {/* 3. Detailed Invoice Receipt Inspection Modal */}
      <InvoiceModal
        sale={selectedSale}
        customers={customers}
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false)
          setSelectedSale(null)
        }}
      />
    </div>
  )
}

export default SoldView
