import React from 'react'
import { useTranslation } from 'react-i18next'
import { Barcode, Plus } from 'lucide-react'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'

interface BarcodeBarProps {
  barcodeQuery: string
  onChangeQuery: (val: string) => void
  onSubmitBarcode: (e: React.FormEvent) => void
  onOpenQuickAdd: () => void
}

/**
 * BarcodeBar: Fast barcode scanning input and direct Add Item button.
 */
export function BarcodeBar({
  barcodeQuery,
  onChangeQuery,
  onSubmitBarcode,
  onOpenQuickAdd,
}: BarcodeBarProps) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-2">
      <form onSubmit={onSubmitBarcode} className="flex-1 flex gap-2">
        <Input
          value={barcodeQuery}
          onChange={(e) => onChangeQuery(e.target.value)}
          placeholder={t('pos.scanPlaceholder')}
          startIcon={<Barcode className="w-4 h-4 text-gray-400" />}
          containerClassName="flex-1"
        />
        <Button variant="outline" type="submit">
          {t('common.add')}
        </Button>
      </form>

      <Button
        variant="primary"
        onClick={onOpenQuickAdd}
        icon={<Plus className="w-3.5 h-3.5" />}
      >
        {t('products.addProduct')}
      </Button>
    </div>
  )
}
