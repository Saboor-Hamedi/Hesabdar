import type { Sale, Customer } from '../../../core/types'
import { PrintPreviewModal } from '../../../components/ui/PrintPreviewModal'

export interface ReceiptModalProps {
  sale: Sale | null
  customers: Customer[]
  isOpen: boolean
  onClose: () => void
  onNewSale: () => void
}

/**
 * ReceiptModal: Clean 2-column Chrome/Electron-style print dialog layout for POS checkout.
 * - Left side: Destination printer (with CARAVPOS auto-detect), copies, Print, PDF, New Sale, Close
 * - Right side: Realistic 80mm thermal receipt preview canvas
 */
export function ReceiptModal({
  sale,
  customers,
  isOpen,
  onClose,
  onNewSale,
}: ReceiptModalProps) {
  return (
    <PrintPreviewModal
      sale={sale}
      customers={customers}
      isOpen={isOpen}
      onClose={onClose}
      onNewSale={onNewSale}
    />
  )
}

export default ReceiptModal
