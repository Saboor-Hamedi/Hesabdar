import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Printer,
  FileDown,
  RotateCcw,
  Loader2,
  Zap,
  X,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import type { Sale, Customer } from '../../core/types'
import { formatCurrency } from '../../core/utils/formatters'
import { ThermalReceipt } from './ThermalReceipt'
import { detectBestPrinter, DetectedPrinterInfo } from '../../core/utils/printerDetection'

export interface PrintPreviewModalProps {
  sale: Sale | null
  customers: Customer[]
  isOpen: boolean
  onClose: () => void
  onNewSale?: () => void
  title?: string
}

/**
 * PrintPreviewModal:
 * Professional 2-Column Chrome/Electron-style print dialog layout:
 * - Perfectly aligned equal-height top titlebars across both columns (h-11)
 * - "New Sale" action moved to the top right preview header
 * - Modernized left UI with custom styled dropdown, copies counter, and clean buttons
 * - Exact invoice-width preview viewport (370px) with 100+ items smooth scrolling
 */
export function PrintPreviewModal({
  sale,
  customers,
  isOpen,
  onClose,
  onNewSale,
  title,
}: PrintPreviewModalProps) {
  const { t } = useTranslation()

  const [printers, setPrinters] = useState<DetectedPrinterInfo[]>([])
  const [selectedPrinter, setSelectedPrinter] = useState<string>('')
  const [isThermal, setIsThermal] = useState<boolean>(false)
  const [copies, setCopies] = useState<number>(1)
  const [isPrinting, setIsPrinting] = useState<boolean>(false)
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false)
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const previewScrollRef = useRef<HTMLDivElement>(null)

  // Listen to Escape key to dismiss modal
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Load and auto-detect printers (CARAVPOS, POS-80, Thermal Receipt, etc.)
  useEffect(() => {
    if (window.api?.print?.getPrinters) {
      window.api.print
        .getPrinters()
        .then((rawList) => {
          if (rawList && rawList.length > 0) {
            const detected = detectBestPrinter(rawList)
            setPrinters(detected.annotatedPrinters)
            setSelectedPrinter(detected.selectedName)
            setIsThermal(detected.isThermal)
          }
        })
        .catch((err) => console.error('Failed to load printers:', err))
    }
  }, [])

  // Auto-clear status message after 4 seconds
  useEffect(() => {
    if (!statusMessage) return
    const timer = setTimeout(() => setStatusMessage(null), 4000)
    return () => clearTimeout(timer)
  }, [statusMessage])

  if (!sale || !isOpen) return null

  const customerName = customers.find((c) => c.id === sale.customer_id)?.name
  const itemsCount = sale.items?.length || 0

  const handleSelectPrinter = (name: string) => {
    setSelectedPrinter(name)
    localStorage.setItem('hesabdar_selected_printer', name)
    const match = printers.find((p) => p.name === name)
    setIsThermal(Boolean(match?.isThermal))
  }

  // PDF Export
  const handleSavePDF = async () => {
    if (window.api?.print?.toPDF) {
      try {
        setIsExportingPDF(true)
        setStatusMessage(null)
        const res = await window.api.print.toPDF({
          defaultFilename: `Invoice_${sale.invoice_no}.pdf`,
          landscape: false,
          pageSize: 'A4',
        })
        if (res.success && res.filePath) {
          const fileName = res.filePath.split(/[\\/]/).pop()
          setStatusMessage({
            type: 'success',
            text: `PDF Saved: ${fileName}`,
          })
        }
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          text: err?.message || 'Failed to save PDF receipt',
        })
      } finally {
        setIsExportingPDF(false)
      }
    }
  }

  // Direct 1-Click Silent Print
  const handlePrintReceipt = async (silent = true) => {
    setIsPrinting(true)
    setStatusMessage(null)
    try {
      if (window.api?.print?.direct) {
        for (let i = 0; i < copies; i++) {
          const res = await window.api.print.direct({
            deviceName: selectedPrinter || undefined,
            silent,
          })
          if (res && res.success === false) {
            setStatusMessage({
              type: 'error',
              text: res.failureReason || 'Failed to send to printer.',
            })
            return
          }
        }
        setStatusMessage({
          type: 'success',
          text: `Printed to ${selectedPrinter || 'Default Printer'} (${copies}x)`,
        })
      } else {
        window.print()
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to send to printer.',
      })
    } finally {
      setIsPrinting(false)
    }
  }

  // Jump helpers for 100+ items receipts
  const scrollToTop = () => {
    previewScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const scrollToBottom = () => {
    if (previewScrollRef.current) {
      previewScrollRef.current.scrollTo({
        top: previewScrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 print:static print:p-0 print:block"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity no-print"
        onClick={onClose}
      />

      {/* Main 2-Column Dialog Box (Exact proportions: 270px left + 370px right = 640px) */}
      <div className="relative z-10 w-full max-w-[640px] h-[580px] max-h-[90vh] bg-white rounded-2xl border border-gray-200/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:border-none print:shadow-none print:overflow-visible print:w-auto print:max-w-none print:h-auto print:static">

        {/* ── LEFT COLUMN: Controls & Settings (270px) ───────────────────── */}
        <div className="w-full md:w-[270px] shrink-0 bg-[#F9FAFB] border-e border-gray-200 flex flex-col justify-between no-print select-none">
          {/* Top Section */}
          <div className="flex flex-col">
            {/* Titlebar: EXACT same h-11 height as the right preview titlebar */}
            <div className="h-11 px-3.5 bg-white border-b border-gray-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6.5 h-6.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center justify-center shrink-0">
                  <Printer className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-sm text-gray-900 leading-none">
                  {title || 'Print'}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Controls */}
            <div className="p-3.5 flex flex-col gap-3">
              {/* 1. Destination Printer Selector (Custom Modern Dropdown) */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                    Destination
                  </label>
                  {isThermal && (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80">
                      <Zap className="w-2.5 h-2.5 text-emerald-600" /> POS Thermal
                    </span>
                  )}
                </div>

                <div className="relative">
                  <select
                    value={selectedPrinter}
                    onChange={(e) => handleSelectPrinter(e.target.value)}
                    className="w-full appearance-none bg-white border border-gray-200 hover:border-gray-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30 rounded-xl pl-2.5 pr-7 py-2 text-xs text-gray-900 font-medium transition-all shadow-2xs truncate cursor-pointer"
                  >
                    {printers.length > 0 ? (
                      printers.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.displayName || p.name} {p.isThermal ? '⚡ (Thermal)' : p.isDefault ? '(Default)' : ''}
                        </option>
                      ))
                    ) : (
                      <option value="">Default System Printer</option>
                    )}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </div>
                </div>

                {isThermal ? (
                  <span className="text-[9.5px] text-emerald-700 font-medium flex items-center gap-1">
                    ✓ High-speed 80mm thermal printer ready
                  </span>
                ) : (
                  <span className="text-[9.5px] text-amber-700 font-medium flex items-center gap-1">
                    ℹ️ No POS printer connected (Use Save PDF to test)
                  </span>
                )}
              </div>

              {/* 2. Copies Counter (Modern Inset Pill) */}
              <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
                <span className="text-[10.5px] font-semibold text-gray-700">Copies</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCopies(Math.max(1, copies - 1))}
                    className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center text-xs transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-7 text-center font-mono font-bold text-xs text-gray-900">
                    {copies}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCopies(copies + 1)}
                    className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center text-xs transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 3. Invoice Summary Card */}
              <div className="bg-white rounded-xl border border-gray-200/90 p-3 text-xs flex flex-col gap-1.5 shadow-2xs">
                <div className="flex justify-between items-center text-gray-500 text-[11px]">
                  <span>Items:</span>
                  <span className="font-semibold text-gray-800 font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">
                    {itemsCount} lines
                  </span>
                </div>
                {customerName && (
                  <div className="flex justify-between items-center text-gray-500 text-[11px]">
                    <span>Customer:</span>
                    <span className="font-bold text-gray-900 truncate max-w-[130px]">{customerName}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-gray-900 pt-1.5 border-t border-gray-100">
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500">Payable:</span>
                  <span className="font-mono text-[13px] font-black text-emerald-800">
                    {formatCurrency(sale.total)}
                  </span>
                </div>
              </div>

              {/* Inline Status Message */}
              {statusMessage && (
                <div
                  className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 animate-in fade-in duration-150 ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium'
                      : 'bg-rose-50 border border-rose-200 text-rose-800 font-medium'
                  }`}
                >
                  {statusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  )}
                  <span className="truncate text-[10.5px]">{statusMessage.text}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="p-3.5 pt-0 flex flex-col gap-2">
            {/* Primary Print Button */}
            <button
              type="button"
              onClick={() => handlePrintReceipt(true)}
              disabled={isPrinting}
              className="w-full h-10 text-xs font-bold bg-[#2F6153] hover:bg-[#234b40] text-white rounded-xl shadow-xs hover:shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Printing...</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </>
              )}
            </button>

            {/* Secondary Buttons Row: Save PDF & Close */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleSavePDF}
                disabled={isExportingPDF}
                className="h-8.5 px-2 text-xs font-semibold bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                title="Export receipt as PDF document"
              >
                {isExportingPDF ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
                ) : (
                  <FileDown className="w-3.5 h-3.5 text-rose-600" />
                )}
                <span>Save PDF</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="h-8.5 px-2 text-xs font-semibold bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl transition-all shadow-2xs flex items-center justify-center cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Exact Invoice Width Preview (370px) ─────────── */}
        <div className="w-full md:w-[370px] shrink-0 bg-[#F4F6F8] flex flex-col overflow-hidden relative">

          {/* Sticky Header Bar: EXACT same h-11 height as the left titlebar */}
          <div className="shrink-0 h-11 w-full px-3.5 bg-white border-b border-gray-200 flex items-center justify-between text-xs text-gray-700 select-none z-10">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-gray-900 text-[11px] truncate">80mm Receipt</span>
              <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-semibold shrink-0">
                {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Right Action Cluster: Jump navigation + "New Sale" Button */}
            <div className="flex items-center gap-1.5 shrink-0">
              {itemsCount > 6 && (
                <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 px-1 py-0.5 rounded">
                  <button
                    type="button"
                    onClick={scrollToTop}
                    className="hover:text-gray-950 px-1 transition-colors cursor-pointer"
                    title="Top"
                  >
                    Top
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={scrollToBottom}
                    className="text-emerald-700 font-bold hover:text-emerald-900 px-1 transition-colors cursor-pointer"
                    title="Totals"
                  >
                    Totals
                  </button>
                </div>
              )}

              {/* "New Sale" moved right to the top bar as requested */}
              {onNewSale && (
                <button
                  type="button"
                  onClick={onNewSale}
                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 rounded-lg text-[11px] font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-3 h-3 text-emerald-700" />
                  <span>{t('pos.newSale', 'New Sale')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Receipt Viewport (Exact width as invoice paper) */}
          <div
            ref={previewScrollRef}
            className="flex-1 overflow-y-auto p-2.5 flex flex-col items-center bg-[#F4F6F8]"
          >
            {/* The Thermal Receipt Paper: fills width completely */}
            <div className="w-full bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-200 rounded-t-sm p-3.5 text-xs shrink-0 mb-3 transition-all">
              <ThermalReceipt
                sale={{
                  ...sale,
                  customer_name: customerName,
                }}
                className="bg-white border-none shadow-none p-0 rounded-none"
                showSerratedEdge={true}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default PrintPreviewModal
