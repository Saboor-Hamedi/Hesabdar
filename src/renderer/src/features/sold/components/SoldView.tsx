import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Receipt } from 'lucide-react'
import { getSales, deleteSale, getCustomers, onStoreChange } from '../../../core/store'
import type { Sale, Customer } from '../../../core/types'
import { SoldMetrics } from '../metrics/SoldMetrics'
import { SoldTable } from '../table/SoldTable'
import { InvoiceModal } from '../details/InvoiceModal'

/**
 * SoldView: Cleanly decomposed view for managing all completed customer invoices and sold items.
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
    <div className="flex flex-col gap-4 max-w-7xl mx-auto select-none">
      {/* Page Header */}
      <div>
        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-emerald-600" />
          {t('sold.title')}
        </h2>
        <p className="text-[11px] text-gray-400 mt-0.5">{t('sold.subtitle')}</p>
      </div>

      {/* 1. KPI Metric Summary Cards */}
      <SoldMetrics sales={sales} />

      {/* 2. Invoices Data Table */}
      <SoldTable
        sales={sales}
        customers={customers}
        onViewReceipt={handleViewReceipt}
        onVoidSale={handleVoidSale}
      />

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
