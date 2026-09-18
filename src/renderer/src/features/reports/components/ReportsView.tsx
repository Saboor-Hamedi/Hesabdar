import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart3, Download } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { PageHeader } from '../../../components/layout/PageHeader'
import { getSales, getCustomers, getSuppliers, getProducts, onStoreChange } from '../../../core/store'
import { notify } from '../../../core/notifications'
import { FinancialCards } from '../metrics/FinancialCards'
import { InventoryValuationCard } from '../inventory/InventoryValuationCard'
import { TaxBreakdownCard } from '../tax/TaxBreakdownCard'

/**
 * ReportsView: Sleek accounting & reports command center composed of modular subcomponents.
 */
export function ReportsView() {
  const { t } = useTranslation()
  const [sales, setSales] = useState(() => getSales())
  const [customers, setCustomers] = useState(() => getCustomers())
  const [suppliers, setSuppliers] = useState(() => getSuppliers())
  const [products, setProducts] = useState(() => getProducts())

  useEffect(() => {
    const update = () => {
      setSales(getSales())
      setCustomers(getCustomers())
      setSuppliers(getSuppliers())
      setProducts(getProducts())
    }
    update()
    const unsubscribe = onStoreChange(update)
    return unsubscribe
  }, [])

  // Real financial calculations
  const grossSales = useMemo(() => sales.reduce((sum, s) => sum + (s.total || 0), 0), [sales])
  const cogs = useMemo(
    () =>
      sales.reduce((sum, s) => {
        const itemCosts = s.items?.reduce((c, it) => c + (it.cost_price || 0) * (it.qty || 1), 0) || 0
        return sum + itemCosts
      }, 0),
    [sales]
  )
  const netProfit = grossSales - cogs
  const totalCustomerDebt = useMemo(() => customers.reduce((sum, c) => sum + (c.balance || 0), 0), [customers])
  const totalSupplierPayable = useMemo(() => suppliers.reduce((sum, s) => sum + (s.balance || 0), 0), [suppliers])

  // Export real sales to CSV
  const handleExportSalesCSV = () => {
    if (sales.length === 0) {
      notify({
        type: 'warning',
        title: 'No Sales',
        message: 'There are no completed sales transactions to export.',
      })
      return
    }

    const headers = ['Invoice No', 'Date', 'Payment Mode', 'Customer ID', 'Subtotal', 'Discount', 'Total']
    const rows = sales.map((s) => [
      `"${s.invoice_no}"`,
      `"${s.created_at}"`,
      `"${s.payment_mode}"`,
      s.customer_id || '""',
      s.subtotal,
      s.discount,
      s.total,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `hesabdar_sales_ledger_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    notify({
      type: 'success',
      title: 'Sales CSV Exported',
      message: `${sales.length} invoices exported successfully.`,
    })
  }

  return (
    <div className="flex flex-col h-full min-h-0 gap-3.5 max-w-7xl mx-auto w-full select-none overflow-y-auto pr-1">
      {/* Unified Page Header */}
      <PageHeader
        title={t('reports.title')}
        subtitle={t('reports.subtitle')}
        icon={BarChart3}
        action={
          <Button
            variant="outline"
            onClick={handleExportSalesCSV}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export Sales CSV
          </Button>
        }
      />

      {/* 1. Financial Performance Ledger Cards */}
      <FinancialCards
        grossSales={grossSales}
        cogs={cogs}
        netProfit={netProfit}
        totalCustomerDebt={totalCustomerDebt}
        totalSupplierPayable={totalSupplierPayable}
        salesCount={sales.length}
        customersCount={customers.length}
        suppliersCount={suppliers.length}
      />

      {/* 2. Stock Inventory Valuation & Asset Breakdown */}
      <InventoryValuationCard products={products} />

      {/* 3. Monthly Breakdown & BRT Fiscal Tax Compliance */}
      <TaxBreakdownCard grossSales={grossSales} />
    </div>
  )
}

export default ReportsView
