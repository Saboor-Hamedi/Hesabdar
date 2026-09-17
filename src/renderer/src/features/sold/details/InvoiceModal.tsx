import { Printer, FileDown } from 'lucide-react'
import type { Sale, Customer } from '../../../core/types'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { ThermalReceipt } from '../../../components/ui/ThermalReceipt'
import { notify } from '../../../core/notifications'

interface InvoiceModalProps {
  sale: Sale | null
  customers: Customer[]
  isOpen: boolean
  onClose: () => void
}

/**
 * InvoiceModal: Dedicated inspection modal for completed invoice receipts.
 */
export function InvoiceModal({
  sale,
  customers,
  isOpen,
  onClose,
}: InvoiceModalProps) {
  if (!sale) return null

  const customerName = customers.find((c) => c.id === sale.customer_id)?.name

  const handleSavePDF = async () => {
    if (window.api?.print?.toPDF) {
      try {
        const res = await window.api.print.toPDF({
          defaultFilename: `Invoice_${sale.invoice_no}.pdf`,
          landscape: false,
          pageSize: 'A4',
        })
        if (res.success && res.filePath) {
          notify({
            type: 'success',
            title: 'Invoice PDF Saved',
            message: `Saved: ${res.filePath.split(/[\\/]/).pop()}`,
          })
        }
      } catch (err: any) {
        console.error('PDF error:', err)
        notify({
          type: 'error',
          title: 'PDF Export Failed',
          message: err?.message || 'Could not export PDF',
        })
      }
    } else {
      notify({
        type: 'warning',
        title: 'PDF Export',
        message: 'Native PDF export requires desktop application.',
      })
    }
  }

  const handlePrint = async () => {
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
    >
      <div className="flex flex-col gap-2.5">
        <ThermalReceipt
          sale={{
            ...sale,
            customer_name: customerName,
          }}
        />

        <div className="no-print flex items-center gap-1.5 pt-2 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-8 text-xs font-semibold rounded-[5px]"
          >
            Close
          </Button>
          <Button
            variant="outline"
            onClick={handleSavePDF}
            icon={<FileDown className="w-3.5 h-3.5 text-rose-600" />}
            className="h-8 px-2 text-xs font-semibold hover:bg-rose-50 border-rose-200 text-rose-800"
            title="Save as PDF"
          >
            PDF
          </Button>
          <Button
            variant="primary"
            onClick={handlePrint}
            icon={<Printer className="w-3.5 h-3.5" />}
            className="flex-1 h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-[5px] shadow-sm flex items-center justify-center gap-1"
          >
            Print Receipt
          </Button>
        </div>
      </div>
    </Modal>
  )
}
