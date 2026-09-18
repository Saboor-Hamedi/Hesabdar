import type { Sale, Customer } from '../../../core/types'
import { PrintPreviewModal } from '../../../components/ui/PrintPreviewModal'

export interface InvoiceModalProps {
  sale: Sale | null
  customers: Customer[]
  isOpen: boolean
  onClose: () => void
}

/**
 * InvoiceModal: Clean 2-column Chrome/Electron-style print dialog layout for Sold Invoices history.
 * - Left side: Destination printer (with CARAVPOS auto-detect), copies, Print, PDF, Close
 * - Right side: Realistic 80mm thermal receipt preview canvas
 */
export function InvoiceModal({
  sale,
  customers,
  isOpen,
  onClose,
}: InvoiceModalProps) {
  return (
    <PrintPreviewModal
      sale={sale}
      customers={customers}
      isOpen={isOpen}
      onClose={onClose}
    />
  )
}

export default InvoiceModal
