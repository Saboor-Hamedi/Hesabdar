import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
            title: t('settings.backupSuccess'),
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
        title: t('settings.backupSuccess'),
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
    const confirmed = window.confirm(t('settings.restoreConfirm'))
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
              title: t('settings.restoreSuccess'),
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
              title: t('settings.restoreSuccess'),
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
              title: t('settings.restoreSuccess'),
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
      title={t('settings.backupTitle')}
      subtitle={t('settings.backupDesc')}
    >
      <div className="flex flex-col gap-3 py-1">
        {/* Live Shop Records Strip */}
        <div className="p-3 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-[5px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[5px] bg-emerald-100/70 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-800 dark:text-slate-100 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  {t('settings.excelEngineReady')}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-[3px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" /> {t('settings.excelReady')}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                {t('settings.excelSheetsDesc')}
              </p>
            </div>
          </div>

          {/* Quick dataset indicators */}
          <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono text-gray-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-[4px]">
              <Package className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {productsCount} {t('settings.items')}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-[4px]">
              <Receipt className="w-3 h-3 text-blue-600 dark:text-blue-400" /> {salesCount} {t('settings.sales')}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-[4px]">
              <Users className="w-3 h-3 text-purple-600 dark:text-purple-400" /> {customersCount} {t('settings.customers_count')}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-[4px]">
              <Truck className="w-3 h-3 text-amber-600 dark:text-amber-400" /> {suppliersCount} {t('settings.suppliers_count')}
            </span>
          </div>
        </div>

        {/* 2-Column Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
          {/* Action 1: Export to Excel */}
          <div className="p-4 rounded-[5px] border border-gray-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors flex flex-col justify-between gap-3 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-[5px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-gray-800 dark:text-slate-100">
                  {t('settings.exportExcelTitle')}
                </h4>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed">
                {t('settings.exportExcelDesc')}
              </p>
            </div>

            <Button
              variant="primary"
              onClick={handleDownloadExcelBackup}
              isLoading={downloading}
              icon={<Download className="w-3.5 h-3.5" />}
              className="w-full h-8.5 text-xs font-semibold"
            >
              {t('settings.exportExcelBtn')}
            </Button>
          </div>

          {/* Action 2: Restore from Excel */}
          <div className="p-4 rounded-[5px] border border-gray-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500 dark:hover:border-blue-500 transition-colors flex flex-col justify-between gap-3 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-[5px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-gray-800 dark:text-slate-100">
                  {t('settings.restoreExcelTitle')}
                </h4>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-relaxed">
                {t('settings.restoreExcelDesc')}
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
              icon={<Upload className="w-3.5 h-3.5 text-gray-600 dark:text-slate-400" />}
              className="w-full h-8.5 text-xs font-semibold"
            >
              {t('settings.restoreExcelBtn')}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default BackupCard
