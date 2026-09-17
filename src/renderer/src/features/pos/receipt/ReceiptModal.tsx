import { useTranslation } from 'react-i18next'
import { CheckCircle, Printer, FileDown } from 'lucide-react'
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
      title={t('pos.transactionCompleted')}
      subtitle={`Invoice #${sale.invoice_no}`}
      maxWidth="max-w-[360px]"
    >
      <div className="flex flex-col gap-2.5">
        <div className="no-print flex items-center gap-2 p-2.5 rounded-[5px] bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold shadow-2xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{t('pos.stockUpdated')}</span>
        </div>

        <ThermalReceipt
          sale={{
            ...sale,
            customer_name: customerName,
          }}
        />

        <div className="no-print flex items-center gap-1.5 pt-2 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={onNewSale}
            className="flex-1 h-8 text-xs font-semibold rounded-[5px]"
          >
            {t('pos.newSale')}
          </Button>

          <Button
            variant="outline"
            onClick={handleSavePDF}
            icon={<FileDown className="w-3.5 h-3.5 text-rose-600" />}
            className="h-8 px-2 text-xs font-semibold hover:bg-rose-50 border-rose-200 text-rose-800"
            title="Save receipt as PDF"
          >
            PDF
          </Button>

          <Button
            variant="primary"
            onClick={handlePrintReceipt}
            icon={<Printer className="w-3.5 h-3.5" />}
            className="flex-1 h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-[5px] shadow-sm flex items-center justify-center gap-1"
          >
            {t('pos.printReceipt')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
