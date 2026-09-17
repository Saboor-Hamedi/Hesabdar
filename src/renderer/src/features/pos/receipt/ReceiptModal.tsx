import { useTranslation } from 'react-i18next'
import { Printer, FileDown, RotateCcw } from 'lucide-react'
import type { Sale, Customer } from '../../../core/types'
import { notify } from '../../../core/notifications'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { ThermalReceipt } from '../../../components/ui/ThermalReceipt'

interface ReceiptModalProps {
  sale: Sale | null
  customers: Customer[]
  isOpen: boolean
  onClose: () => void
  onNewSale: () => void
}

/**
 * ReceiptModal: Clean thermal receipt presentation modal with direct 80mm/58mm printing and PDF export.
 */
export function ReceiptModal({
  sale,
  customers,
  isOpen,
  onClose,
  onNewSale,
}: ReceiptModalProps) {
  const { t } = useTranslation()

  if (!sale) return null

  const customerName = customers.find((c) => c.id === sale.customer_id)?.name

  const handleSavePDF = async () => {
    if (window.api?.print?.toPDF) {
      try {
        const res = await window.api.print.toPDF({
          defaultFilename: `Receipt_${sale.invoice_no}.pdf`,
          landscape: false,
          pageSize: 'A4',
        })
        if (res.success && res.filePath) {
          notify({
            type: 'success',
            title: 'Receipt PDF Saved',
            message: `Saved: ${res.filePath.split(/[\\/]/).pop()}`,
          })
        }
      } catch (err: any) {
        console.error('PDF error:', err)
        notify({
          type: 'error',
          title: 'PDF Export Failed',
          message: err?.message || 'Failed to save PDF receipt',
        })
      }
    } else {
      notify({
        type: 'warning',
        title: 'PDF Export',
        message: 'Native PDF export requires the desktop application.',
      })
    }
  }

  const handlePrintReceipt = async () => {
    if (window.api?.print?.direct) {
      try {
        await window.api.print.direct({ silent: false })
      } catch {
        window.print()
      }
    } else {
      window.print()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('pos.transactionCompleted', 'Transaction Completed!')}
      subtitle="Stock levels updated automatically."
      badge={
        <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
          #{sale.invoice_no}
        </span>
      }
      style={{ width: '420px', maxWidth: '95vw' }}
      bodyClassName="p-8"
    >
      <div className="flex flex-col gap-4">
        <ThermalReceipt
          sale={{
            ...sale,
            customer_name: customerName,
          }}
        />

        {/* Action Button Hierarchy: New Sale is Primary, Print & PDF are Secondary */}
        <div className="no-print flex flex-col gap-3 pt-3 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-2.5">
            <Button
              variant="outline"
              onClick={handlePrintReceipt}
              icon={<Printer className="w-4 h-4 text-gray-600" />}
              className="h-10 text-xs font-semibold bg-[#F9FAFB] hover:bg-gray-100 text-gray-800 border border-gray-200/80 rounded-xl"
            >
              {t('pos.printReceipt', 'Print Receipt')}
            </Button>

            <Button
              variant="outline"
              onClick={handleSavePDF}
              icon={<FileDown className="w-4 h-4 text-gray-600" />}
              className="h-10 text-xs font-semibold bg-[#F9FAFB] hover:bg-gray-100 text-gray-800 border border-gray-200/80 rounded-xl"
              title="Save receipt as PDF"
            >
              Save PDF
            </Button>
          </div>

          <Button
            variant="primary"
            onClick={onNewSale}
            icon={<RotateCcw className="w-4 h-4" />}
            className="w-full h-11 text-sm font-bold bg-[#5A8F7B] hover:bg-[#4A7C6F] text-white rounded-xl shadow-sm"
          >
            {t('pos.newSale', 'New Sale')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
