import { useRef, useState } from 'react'
import {
  FileSpreadsheet,
  Download,
  Upload,
  ShieldCheck,
  CheckCircle2,
  Package,
  Receipt,
  Users,
  Truck,
} from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import {
  exportDatabaseToExcel,
  importDatabaseFromExcel,
  importDatabaseBackup,
  uint8ArrayToBase64,
  getProducts,
  getSales,
  getCustomers,
  getSuppliers,
} from '../../../core/store'
import { notify } from '../../../core/notifications'

/**
 * BackupCard: Beautiful Excel (.xlsx) database backup export and restore manager.
 * Exports comprehensive multi-sheet workbooks and allows instant restoration.
 */
export function BackupCard() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [restoring, setRestoring] = useState(false)

  // Live store records
  const productsCount = getProducts().length
  const salesCount = getSales().length
  const customersCount = getCustomers().length
  const suppliersCount = getSuppliers().length

  // Execute Excel Backup Download
  const handleDownloadExcelBackup = async () => {
    try {
      setDownloading(true)
      const excelBytes = exportDatabaseToExcel()
      const timestamp = new Date().toISOString().slice(0, 10)
      const fileName = `hesabdar_database_backup_${timestamp}.xlsx`

      // 1. Native Electron Save Dialog if available
      if (window.api?.backup?.save) {
        const base64Data = uint8ArrayToBase64(excelBytes)
        const result = await window.api.backup.save(base64Data, fileName)
        if (result.canceled) return
        if (result.success) {
          notify({
            type: 'success',
            title: 'Excel Backup Saved',
            message: `Workbook saved to: ${result.filePath}`,
          })
          return
        }
      }

      // 2. Web fallback: standard blob download link
      const blob = new Blob([excelBytes as BlobPart], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      notify({
        type: 'success',
        title: 'Excel Backup Downloaded',
        message: 'Multi-sheet Excel backup downloaded with complete inventory, invoices, and accounts.',
      })
    } catch (err) {
      console.error('Excel backup export error:', err)
      notify({
        type: 'error',
        title: 'Export Failed',
        message: 'Unable to generate Excel backup file.',
      })
    } finally {
      setDownloading(false)
    }
  }

  // Handle restoring data
  const handleTriggerRestore = async () => {
    const confirmed = window.confirm(
      'Warning: Restoring from Excel will update or overwrite store data. Do you wish to continue?'
    )
    if (!confirmed) return

    // 1. Native Electron Open File Dialog
    if (window.api?.backup?.restore) {
      try {
        setRestoring(true)
        const result = await window.api.backup.restore()
        if (result.canceled) return
        if (result.success && result.content) {
          let success = false
          if (result.isExcel) {
            success = importDatabaseFromExcel(result.content)
          } else {
            // JSON fallback
            try {
              const text = window.atob(result.content)
              success = importDatabaseBackup(text)
            } catch {
              success = importDatabaseFromExcel(result.content)
            }
          }

          if (success) {
            notify({
              type: 'success',
              title: 'Database Restored',
              message: 'All records restored from Excel workbook.',
            })
            setTimeout(() => {
              window.location.reload()
            }, 800)
          } else {
            notify({
              type: 'error',
              title: 'Restore Failed',
              message: 'The selected Excel file is invalid or missing required sheets.',
            })
          }
        }
      } catch (err) {
        console.error('Native restore error:', err)
      } finally {
        setRestoring(false)
      }
      return
    }

    // 2. Browser fallback file input
    fileInputRef.current?.click()
  }

  // Handle browser file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setRestoring(true)
    const isJson = file.name.toLowerCase().endsWith('.json')

    if (isJson) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string
          const success = importDatabaseBackup(text)
          if (success) {
            notify({
              type: 'success',
              title: 'Database Restored',
              message: 'Store records restored from JSON backup.',
            })
            setTimeout(() => window.location.reload(), 800)
          }
        } catch {
          notify({ type: 'error', title: 'Invalid JSON', message: 'Could not parse JSON backup.' })
        } finally {
          setRestoring(false)
          if (fileInputRef.current) fileInputRef.current.value = ''
        }
      }
      reader.readAsText(file)
    } else {
      // Excel File (.xlsx, .xls)
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const buffer = event.target?.result as ArrayBuffer
          const success = importDatabaseFromExcel(buffer)
          if (success) {
            notify({
              type: 'success',
              title: 'Excel Restored',
              message: 'Products, customers, suppliers, and sales successfully imported.',
            })
            setTimeout(() => window.location.reload(), 800)
          } else {
            notify({
              type: 'error',
              title: 'Restore Failed',
              message: 'The selected Excel workbook could not be imported.',
            })
          }
        } catch (err) {
          console.error('Excel parse error:', err)
          notify({
            type: 'error',
            title: 'File Error',
            message: 'Unable to parse Excel workbook.',
          })
        } finally {
          setRestoring(false)
          if (fileInputRef.current) fileInputRef.current.value = ''
        }
      }
      reader.readAsArrayBuffer(file)
    }
  }

  return (
    <Card
      title="Excel Database Backup & Restore"
      subtitle="Export complete store records to a beautiful multi-sheet Excel file (.xlsx) or restore database from Excel"
    >
      <div className="flex flex-col gap-3 py-1">
        {/* Live Shop Records Strip */}
        <div className="p-3 bg-emerald-50/40 border border-emerald-200/60 rounded-[5px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[5px] bg-emerald-100/70 text-emerald-800 flex items-center justify-center shrink-0 shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Excel Data Engine (.xlsx)
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-[3px] bg-emerald-100 text-emerald-800 font-medium flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Ready
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Formatted sheets: Overview, Products, Customers, Suppliers, Sales, and Line Items.
              </p>
            </div>
          </div>

          {/* Quick dataset indicators */}
          <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono text-gray-600">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded-[4px]">
              <Package className="w-3 h-3 text-emerald-600" /> {productsCount} items
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded-[4px]">
              <Receipt className="w-3 h-3 text-blue-600" /> {salesCount} sales
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded-[4px]">
              <Users className="w-3 h-3 text-purple-600" /> {customersCount} customers
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded-[4px]">
              <Truck className="w-3 h-3 text-amber-600" /> {suppliersCount} suppliers
            </span>
          </div>
        </div>

        {/* 2-Column Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
          {/* Action 1: Export to Excel */}
          <div className="p-4 rounded-[5px] border border-gray-200/90 bg-white hover:border-emerald-500 transition-colors flex flex-col justify-between gap-3 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-[5px] bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-gray-800">
                  Export Excel Backup (.xlsx)
                </h4>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Generates a clean, styled Excel workbook with styled headers and dedicated sheets for all records.
              </p>
            </div>

            <Button
              variant="primary"
              onClick={handleDownloadExcelBackup}
              isLoading={downloading}
              icon={<Download className="w-3.5 h-3.5" />}
              className="w-full h-8.5 text-xs font-semibold"
            >
              Download Excel Backup (.xlsx)
            </Button>
          </div>

          {/* Action 2: Restore from Excel */}
          <div className="p-4 rounded-[5px] border border-gray-200/90 bg-white hover:border-blue-500 transition-colors flex flex-col justify-between gap-3 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-[5px] bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-gray-800">
                  Restore from Excel File
                </h4>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Load a previously exported Excel (.xlsx) file to restore inventory, prices, customers, and invoices.
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls, .json"
              className="hidden"
            />

            <Button
              variant="outline"
              onClick={handleTriggerRestore}
              isLoading={restoring}
              icon={<Upload className="w-3.5 h-3.5 text-gray-600" />}
              className="w-full h-8.5 text-xs font-semibold"
            >
              Upload &amp; Restore (.xlsx)
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default BackupCard
