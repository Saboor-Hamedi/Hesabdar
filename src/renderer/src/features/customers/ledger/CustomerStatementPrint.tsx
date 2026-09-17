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
          {/* Direct PDF Export Button: Neutral gray / blue outline per suggestion.md */}
          <button
            type="button"
            onClick={handleSavePDF}
            disabled={isExportingPDF}
            className="h-9 px-3.5 rounded-lg text-xs font-semibold bg-white hover:bg-gray-50 active:scale-[0.98] text-gray-700 border border-gray-200 flex items-center gap-2 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            title="Export official PDF document"
          >
            <FileDown className="w-4 h-4 text-gray-500" />
            <span>{isExportingPDF ? 'Exporting PDF...' : 'Save as PDF'}</span>
          </button>

          {/* Direct Print Button: Matching height and weight */}
          <button
            type="button"
            onClick={handlePrint}
            className="h-9 px-3.5 rounded-lg text-xs font-semibold bg-[#5A8F7B] hover:bg-[#4A7C6F] active:scale-[0.98] text-white flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
            title="Print statement directly to printer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Statement</span>
          </button>
        </div>
      </div>

      {/* Printable Paper Canvas */}
      <div
        id="printable-statement"
        className="bg-white p-6 sm:p-8 border border-gray-200 rounded-[8px] shadow-sm print:shadow-none print:border-none print:p-0"
      >
        {/* Document Header with Shop Branding */}
        <div className="flex justify-between items-start pb-6 border-b-2 border-gray-800">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">{storeName}</h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest mt-0.5">
              Customer Account Statement / صورت حساب مشتری
            </p>
            {storePhone && <p className="text-xs text-gray-600 mt-1 font-mono">Tel: {storePhone}</p>}
            {storeAddress && <p className="text-xs text-gray-500">{storeAddress}</p>}
          </div>

          <div className="text-end">
            <span className="inline-block px-2.5 py-1 text-xs font-mono font-bold uppercase tracking-wider bg-gray-100 text-gray-800 rounded">
              STATEMENT #{customer.id.toString().padStart(5, '0')}
            </span>
            <p className="text-xs text-gray-500 mt-1.5">
              Date: <strong className="text-gray-800 font-mono">{formatDateTime(new Date().toISOString())}</strong>
            </p>
          </div>
        </div>

        {/* Customer Profile & Summary Block */}
        <div className="grid grid-cols-2 gap-4 py-4 border-b border-gray-200 my-2 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
              Bill To / حساب مشتری:
            </span>
            <p className="text-sm font-bold text-gray-900 mt-0.5">{customer.name}</p>
            {customer.phone && <p className="text-gray-600 font-mono mt-0.5">{customer.phone}</p>}
            {customer.address && <p className="text-gray-500 mt-0.5">{customer.address}</p>}
          </div>

          <div className="text-end">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
              Account Status:
            </span>
            <div className="mt-1 flex flex-col items-end gap-0.5">
              <span className="text-xs text-gray-600">
                Invoiced: <strong className="font-mono text-gray-900">{formatCurrency(totalInvoiced)}</strong>
              </span>
              <span className="text-xs text-emerald-700">
                Paid: <strong className="font-mono">{formatCurrency(totalPaid)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Highlighted Closing Balance Card */}
        <div
          className={`p-3.5 rounded-[6px] my-3 flex items-center justify-between border ${
            currentBalance < 0
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : currentBalance === 0
                ? 'bg-gray-50 border-gray-200 text-gray-800'
                : 'bg-rose-50/70 border-rose-200 text-rose-950'
          }`}
        >
          <div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider block ${
                currentBalance < 0
                  ? 'text-emerald-800'
                  : currentBalance === 0
                    ? 'text-gray-600'
                    : 'text-rose-800'
              }`}
            >
              {currentBalance < 0
                ? 'Account in Advance Credit / طلب مشتری'
                : currentBalance === 0
                  ? 'Account Fully Settled / تصفیه کامل'
                  : 'Total Outstanding Balance Due / باقیمانده بدهی'}
            </span>
            <span className="text-[11px] text-gray-500 mt-0.5 block">
              {currentBalance < 0
                ? 'Customer holds prepaid store credit.'
                : currentBalance === 0
                  ? 'Zero outstanding debt balance.'
                  : 'Payable according to store credit terms.'}
            </span>
          </div>

          <div className="text-end">
            <span
              className={`text-2xl font-black font-mono tracking-tight block ${
                currentBalance < 0
                  ? 'text-emerald-700'
                  : currentBalance === 0
                    ? 'text-gray-800'
                    : 'text-rose-700'
              }`}
            >
              {currentBalance < 0
                ? `+${formatCurrency(Math.abs(currentBalance))}`
                : formatCurrency(currentBalance)}
            </span>
          </div>
        </div>

        {/* Detailed Itemized Ledger Table */}
        <table className="w-full text-xs text-start border-collapse mt-4">
          <thead>
            <tr className="border-b-2 border-gray-200 text-gray-500 uppercase text-[10px] font-semibold">
              <th className="py-2 text-start font-mono">Date</th>
              <th className="py-2 text-start">Ref #</th>
              <th className="py-2 text-start">Description</th>
              <th className="py-2 text-end font-mono">Total (+)</th>
              <th className="py-2 text-end font-mono">Paid Cash (-)</th>
              <th className="py-2 text-end font-mono">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-400">
                  No chronological transaction records for this customer account.
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
                  <td className="py-2 text-end text-gray-900 font-semibold font-mono">
                    {entry.invoiced > 0 ? formatCurrency(entry.invoiced) : '—'}
                  </td>
                  <td className="py-2 text-end text-emerald-700 font-semibold font-mono">
                    {entry.paid > 0 ? formatCurrency(entry.paid) : '—'}
                  </td>
                  <td className="py-2 text-end font-bold font-mono">
                    {entry.balance > 0 ? (
                      <span className="text-rose-700">+{formatCurrency(entry.balance)}</span>
                    ) : entry.balance < 0 ? (
                      <span className="text-emerald-700">-{formatCurrency(Math.abs(entry.balance))}</span>
                    ) : (
                      <span className="text-gray-500 font-medium">0 AFN</span>
                    )}
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
              <td className="py-2.5 text-end font-mono text-gray-900">
                {formatCurrency(totalInvoiced)}
              </td>
              <td className="py-2.5 text-end font-mono text-emerald-700">
                {formatCurrency(totalPaid)}
              </td>
              <td
                className={`py-2.5 text-end font-mono font-black ${
                  currentBalance < 0
                    ? 'text-emerald-800'
                    : currentBalance === 0
                      ? 'text-gray-900'
                      : 'text-rose-800'
                }`}
              >
                {currentBalance < 0
                  ? `Credit: +${formatCurrency(Math.abs(currentBalance))}`
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
