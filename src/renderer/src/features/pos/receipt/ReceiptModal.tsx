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
      title="Invoice Details"
      subtitle={`Invoice #${sale.invoice_no}`}
      maxWidth="max-w-[360px]"
      compactHeader
    >
      <div className="flex flex-col gap-2.5">
        <ThermalReceipt
          sale={{
            ...sale,
            customer_name: customerName,
          }}
        />

        {/* Action Button Hierarchy: New Sale is Primary, Print & PDF are Secondary */}
        <div className="no-print flex flex-col gap-2 pt-2 border-t border-gray-100">
          <Button
            variant="primary"
            onClick={onNewSale}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            className="w-full h-8.5 text-xs font-bold bg-[#5A8F7B] hover:bg-[#4A7C6F] text-white rounded-[6px] shadow-xs"
          >
            {t('pos.newSale', 'New Sale')}
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={handlePrintReceipt}
              icon={<Printer className="w-3.5 h-3.5 text-gray-600" />}
              className="h-8 text-xs font-semibold bg-[#F9FAFB] hover:bg-gray-100 text-gray-800 border border-gray-200/80 rounded-[6px]"
            >
              {t('pos.printReceipt', 'Print')}
            </Button>

            <Button
              variant="outline"
              onClick={handleSavePDF}
              icon={<FileDown className="w-3.5 h-3.5 text-rose-600" />}
              className="h-8 text-xs font-semibold bg-[#F9FAFB] hover:bg-rose-50 text-rose-800 border border-rose-200 rounded-[6px]"
              title="Save receipt as PDF"
            >
              Save PDF
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
