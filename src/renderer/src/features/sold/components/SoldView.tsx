import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Receipt } from 'lucide-react'
import { getSales, deleteSale, getCustomers, onStoreChange } from '../../../core/store'
import type { Sale, Customer } from '../../../core/types'
import { PageHeader } from '../../../components/layout/PageHeader'
import { SoldMetrics } from '../metrics/SoldMetrics'
import { SoldTable } from '../table/SoldTable'
import { InvoiceModal } from '../details/InvoiceModal'

/**
 * SoldView: Cleanly decomposed view for managing all completed customer invoices and sold items.
 * Standardized with full-viewport layout, sticky table headers, and fixed pagination.
 */
export function SoldView() {
  const { t } = useTranslation()
  const [sales, setSales] = useState<Sale[]>(() => getSales())
  const [customers, setCustomers] = useState<Customer[]>(() => getCustomers())
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)

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

  // Handle viewing invoice receipt
  const handleViewReceipt = (sale: Sale) => {
    setSelectedSale(sale)
    setIsReceiptOpen(true)
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
      />

      {/* 1. Standardized KPI Metric Summary Cards */}
      <SoldMetrics sales={sales} />

      {/* 2. Full-Viewport Sticky Invoices Data Table */}
      <div className="flex-1 min-h-0 flex flex-col mt-1">
        <SoldTable
          sales={sales}
          customers={customers}
          onViewReceipt={handleViewReceipt}
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
