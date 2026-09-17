import { useState, useEffect } from 'react'
import { Printer, FileDown } from 'lucide-react'
import type { Customer } from '../../../core/types'
import { formatCurrency, formatDateTime } from '../../../core/utils/formatters'
import { getSettings } from '../../../core/store'
import { notify } from '../../../core/notifications'

export interface LedgerEntry {
  id: string
  date: string
  type: 'sale_credit' | 'sale_cash' | 'payment' | 'opening_balance'
  refNo: string
  description: string
  invoiced: number
  paid: number
  balance: number
}

interface CustomerStatementPrintProps {
  customer: Customer
  entries: LedgerEntry[]
  totalInvoiced: number
  totalPaid: number
  currentBalance: number
  onClose?: () => void
}

/**
 * CustomerStatementPrint: Elegant printable customer statement / ledger invoice.
 * Supports direct Native PDF export (eliminating unwanted OneNote dialogs) and physical/bluetooth printing.
 */
export function CustomerStatementPrint({
  customer,
  entries,
  totalInvoiced,
  totalPaid,
  currentBalance,
}: CustomerStatementPrintProps) {
  const settings = getSettings()
  const storeName = settings.storeName || 'HESABDAR STORE'
  const storePhone = settings.phone || ''
  const storeAddress = settings.address || ''

  const [printers, setPrinters] = useState<Array<{ name: string; displayName: string; isDefault: boolean }>>([])
  const [selectedPrinter, setSelectedPrinter] = useState<string>('')
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  // Load connected physical & bluetooth printers
  useEffect(() => {
    if (window.api?.print?.getPrinters) {
      window.api.print
        .getPrinters()
        .then((list) => {
          if (list && list.length > 0) {
            setPrinters(list)
            // Prioritize physical printers over virtual OneNote/Fax
            const physicalPrinter = list.find(
              (p) => !p.name.toLowerCase().includes('onenote') && !p.name.toLowerCase().includes('fax')
            )
            const def = physicalPrinter || list.find((p) => p.isDefault) || list[0]
            setSelectedPrinter(def.name)
          }
        })
        .catch((err) => console.error('Failed to load printers:', err))
    }
  }, [])

  // Save directly to PDF file via Electron native dialog & printToPDF
  const handleSavePDF = async () => {
    if (window.api?.print?.toPDF) {
      try {
        setIsExportingPDF(true)
        const cleanName = customer.name.replace(/[\\/:*?"<>|]/g, '').trim().replace(/\s+/g, '_')
        const filename = `Statement_${cleanName}_${new Date().toISOString().slice(0, 10)}.pdf`
        const res = await window.api.print.toPDF({
          defaultFilename: filename,
          landscape: false,
          pageSize: 'A4',
        })
        if (res.success && res.filePath) {
          notify({
            type: 'success',
            title: 'PDF Exported Successfully',
            message: `Statement saved to: ${res.filePath.split(/[\\/]/).pop()}`,
          })
        }
      } catch (err: any) {
        console.error('PDF export error:', err)
        notify({
          type: 'error',
          title: 'PDF Export Failed',
          message: err?.message || 'Could not export PDF file.',
        })
      } finally {
        setIsExportingPDF(false)
      }
    } else {
      notify({
        type: 'warning',
        title: 'PDF Export',
        message: 'Native PDF export requires the desktop application.',
      })
    }
  }

  // Print directly to selected printer
  const handlePrint = async () => {
    if (window.api?.print?.direct && selectedPrinter) {
      try {
        const res = await window.api.print.direct({ deviceName: selectedPrinter, silent: false })
        if (res && res.success === false) {
          notify({
            type: 'error',
            title: 'Print Notice',
            message: res.failureReason || 'Failed to send document to printer.',
          })
        }
      } catch (err: any) {
        notify({
          type: 'error',
          title: 'Print Error',
          message: err?.message || 'Could not send document to printer.',
        })
      }
    } else {
      window.print()
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Print & PDF Action Toolbar (Hidden during print) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-[5px] no-print">
        <div className="flex items-center gap-2">
          {printers.length > 0 ? (
            <div className="flex items-center gap-1.5 text-xs text-gray-700">
              <Printer className="w-3.5 h-3.5 text-gray-500" />
              <select
                value={selectedPrinter}
                onChange={(e) => setSelectedPrinter(e.target.value)}
                className="h-7 px-2 text-xs border border-gray-300 rounded-[4px] bg-white text-gray-800 font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {printers.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.displayName || p.name} {p.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <span className="text-xs text-gray-600 font-medium">
              Official statement ready to export to PDF or print.
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Direct PDF Export Button */}
          <button
            type="button"
            onClick={handleSavePDF}
            disabled={isExportingPDF}
            className="px-3 py-1.5 rounded-[5px] text-xs font-bold bg-rose-50 hover:bg-rose-100 active:scale-[0.98] text-rose-800 border border-rose-200 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            title="Export official PDF document without opening OneNote"
          >
            <FileDown className="w-3.5 h-3.5 text-rose-600" />
            <span>{isExportingPDF ? 'Exporting PDF...' : 'Save as PDF (ذخیره به شکل PDF)'}</span>
          </button>

          {/* Direct Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-[5px] text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            title="Print statement directly to printer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Statement (چاپ)</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet (Live visible preview on screen, exact layout on print & PDF) */}
      <div
        id="printable-customer-statement"
        className="bg-white border border-gray-200/90 rounded-[5px] p-6 text-gray-800 text-xs shadow-xs print:border-none print:shadow-none print:p-0"
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-lg font-black text-gray-950 uppercase tracking-tight">
              {storeName}
            </h1>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
              General Trading &amp; Wholesale Ledger
            </p>
            {storePhone && (
              <p className="text-[11px] text-gray-500 font-mono mt-0.5">Tel: {storePhone}</p>
            )}
            {storeAddress && (
              <p className="text-[11px] text-gray-500 mt-0.5">{storeAddress}</p>
            )}
          </div>

          <div className="text-end">
            <span className="inline-block px-2.5 py-1 rounded-[4px] bg-gray-100 text-gray-800 text-xs font-bold uppercase tracking-wider">
              Account Statement
            </span>
            <p className="text-[11px] text-gray-500 font-mono mt-1.5">
              Date: {formatDateTime(new Date().toISOString())}
            </p>
            <p className="text-[11px] text-gray-500 font-mono">
              Account ID: CUST-{String(1000 + customer.id)}
            </p>
          </div>
        </div>

        {/* Customer Profile Banner */}
        <div className="my-4 p-3 rounded-[5px] bg-gray-50 border border-gray-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-gray-400 font-semibold uppercase block">
              Customer Account
            </span>
            <span className="text-sm font-bold text-gray-900 block mt-0.5">
              {customer.name}
            </span>
            <span className="text-[11px] text-gray-600 font-mono block">
              {customer.phone || 'No phone registered'}
            </span>
            {customer.address && (
              <span className="text-[11px] text-gray-500 block">{customer.address}</span>
            )}
          </div>

          {/* Statement Summary KPI */}
          <div className="flex items-center gap-3 text-end shrink-0">
            <div className="p-2 bg-white rounded border border-gray-200">
              <span className="text-[10px] text-gray-400 block font-medium">Total Billed</span>
              <span className="font-mono font-bold text-xs text-gray-900">
                {formatCurrency(totalInvoiced)}
              </span>
            </div>
            <div className="p-2 bg-white rounded border border-gray-200">
              <span className="text-[10px] text-gray-400 block font-medium">Total Paid</span>
              <span className="font-mono font-bold text-xs text-emerald-700">
                {formatCurrency(totalPaid)}
              </span>
            </div>
            <div className="p-2 bg-amber-50 rounded border border-amber-200">
              <span className="text-[10px] text-amber-800 block font-bold">
                {currentBalance < 0 ? 'Customer Credit' : 'Balance Due (باقی طلب)'}
              </span>
              <span
                className={`font-mono font-black text-xs ${
                  currentBalance < 0 ? 'text-emerald-700' : 'text-amber-900'
                }`}
              >
                {currentBalance < 0
                  ? `+${formatCurrency(Math.abs(currentBalance))}`
                  : formatCurrency(currentBalance)}
              </span>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <table className="w-full text-start border-collapse text-xs my-2">
          <thead>
            <tr className="border-b-2 border-gray-800 text-gray-900 font-bold text-[11px]">
              <th className="py-2 text-start w-32">Date</th>
              <th className="py-2 text-start w-28">Ref No.</th>
              <th className="py-2 text-start">Description &amp; Items</th>
              <th className="py-2 text-end w-24">Billed (+)</th>
              <th className="py-2 text-end w-24">Paid (-)</th>
              <th className="py-2 text-end w-28">Balance Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 font-mono text-[11px]">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-400 font-sans">
                  No purchase or payment history found on this account.
                </td>
              </tr>
            ) : (
              entries.map((entry, idx) => (
                <tr key={entry.id || idx}>
                  <td className="py-2 text-gray-600 font-mono text-[10px]">
                    {formatDateTime(entry.date)}
                  </td>
                  <td className="py-2 text-gray-800 font-semibold">{entry.refNo}</td>
                  <td className="py-2 font-sans text-gray-700">{entry.description}</td>
                  <td className="py-2 text-end text-gray-900 font-semibold">
                    {entry.invoiced > 0 ? formatCurrency(entry.invoiced) : '—'}
                  </td>
                  <td className="py-2 text-end text-emerald-700 font-semibold">
                    {entry.paid > 0 ? formatCurrency(entry.paid) : '—'}
                  </td>
                  <td className="py-2 text-end font-bold text-gray-900">
                    {formatCurrency(entry.balance)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-800 font-bold text-xs">
              <td colSpan={3} className="py-2.5 text-end uppercase font-sans">
                Closing Statement Balance:
              </td>
              <td className="py-2.5 text-end font-mono">{formatCurrency(totalInvoiced)}</td>
              <td className="py-2.5 text-end font-mono text-emerald-700">
                {formatCurrency(totalPaid)}
              </td>
              <td
                className={`py-2.5 text-end font-mono ${
                  currentBalance < 0 ? 'text-emerald-700' : 'text-amber-900'
                }`}
              >
                {currentBalance < 0
                  ? `+${formatCurrency(Math.abs(currentBalance))} (Credit)`
                  : formatCurrency(currentBalance)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Footer Terms & Signatures */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-gray-500 text-[10px] flex justify-between items-end">
          <div>
            <p className="font-semibold text-gray-700">Payment Terms &amp; Confirmation:</p>
            <p className="mt-0.5">Please notify any billing discrepancies within 7 business days.</p>
            <p className="mt-0.5 font-mono">Generated automatically by {storeName} Accounts System</p>
          </div>

          <div className="flex gap-8 text-center">
            <div className="border-t border-gray-400 w-28 pt-1">
              <span className="text-[9px] text-gray-600 block">Customer Signature</span>
            </div>
            <div className="border-t border-gray-400 w-28 pt-1">
              <span className="text-[9px] text-gray-600 block">Authorized Cashier</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerStatementPrint
