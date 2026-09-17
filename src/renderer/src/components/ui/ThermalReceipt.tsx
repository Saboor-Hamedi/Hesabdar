import { useTranslation } from 'react-i18next'
import type { Sale, SaleItem } from '../../core/types'
import { formatCurrency, formatDateTime } from '../../core/utils/formatters'

export interface PrintableSaleData {
  invoice_no: string
  created_at: string
  customer_name?: string | null
  payment_mode: string
  items: SaleItem[]
  subtotal: number
  discount: number
  total: number
}

interface ThermalReceiptProps {
  sale: Sale | PrintableSaleData
  shopName?: string
  shopPhone?: string
  shopAddress?: string
}

/**
 * ThermalReceipt: Clean 80mm/58mm thermal receipt layout.
 * Styled with ID #printable-receipt for isolated window.print() output.
 */
export function ThermalReceipt({
  sale,
  shopName: propShopName,
  shopPhone: propShopPhone,
  shopAddress: propShopAddress,
}: ThermalReceiptProps) {
  const { t } = useTranslation()

  // Cached profile fallback
  const cachedProfile = (() => {
    try {
      const raw = localStorage.getItem('hesabdar_store_profile')
      if (raw) return JSON.parse(raw)
    } catch {}
    return null
  })()

  const shopName = propShopName || cachedProfile?.storeName || t('app.name')
  const shopPhone = propShopPhone || cachedProfile?.phone || ''
  const shopAddress = propShopAddress || cachedProfile?.address || ''

  return (
    <div
      id="printable-receipt"
      className="bg-white text-black font-mono text-[11px] leading-tight p-3 w-full border border-dashed border-gray-300 rounded-[5px] shadow-xs"
    >
      {/* Receipt Header */}
      <div className="text-center pb-2 mb-2 border-b border-dashed border-gray-400">
        <h2 className="text-sm font-bold tracking-wide uppercase font-sans">
          {shopName || 'HESABDAR'}
        </h2>
        <p className="text-[10px] text-gray-700 font-sans">Advanced Shop & Accounting System</p>
        {shopAddress && <p className="text-[10px] text-gray-600 font-sans">{shopAddress}</p>}
        {shopPhone && <p className="text-[10px] text-gray-600 font-mono">Tel: {shopPhone}</p>}
      </div>

      {/* Invoice Meta */}
      <div className="flex flex-col gap-0.5 text-[10px] pb-2 mb-2 border-b border-dashed border-gray-300">
        <div className="flex justify-between">
          <span className="font-bold font-sans">Invoice:</span>
          <span className="font-mono font-bold">{sale.invoice_no}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-sans text-gray-700">Date & Time:</span>
          <span className="font-mono">{formatDateTime(sale.created_at)}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-sans text-gray-700">Payment:</span>
          <span className="font-mono font-bold uppercase">{sale.payment_mode}</span>
        </div>
        {'customer_name' in sale && sale.customer_name && (
          <div className="flex justify-between">
            <span className="font-sans text-gray-700">Customer:</span>
            <span className="font-sans font-semibold">{sale.customer_name}</span>
          </div>
        )}
      </div>

      {/* Line Items Table */}
      <div className="pb-2 mb-2 border-b border-dashed border-gray-300">
        <table className="w-full text-left text-[10px]">
          <thead>
            <tr className="border-b border-gray-300 pb-1 font-sans text-gray-600">
              <th className="py-0.5 font-semibold text-start">Item</th>
              <th className="py-0.5 text-center font-semibold">Qty</th>
              <th className="py-0.5 text-end font-semibold">Price</th>
              <th className="py-0.5 text-end font-semibold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sale.items?.map((it, idx) => (
              <tr key={idx}>
                <td className="py-1 text-start pr-1">
                  <div className="font-medium text-black leading-snug">{it.product_name}</div>
                </td>
                <td className="py-1 text-center font-mono align-top text-gray-700">
                  {it.qty} {it.unit || ''}
                </td>
                <td className="py-1 text-end font-mono align-top text-gray-700">
                  {formatCurrency(it.unit_price)}
                </td>
                <td className="py-1 text-end font-mono font-bold align-top text-black">
                  {formatCurrency(it.line_total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Calculation */}
      <div className="flex flex-col gap-1 text-[11px] pb-2 mb-2 border-b border-dashed border-gray-400">
        <div className="flex justify-between text-gray-700">
          <span className="font-sans">Subtotal:</span>
          <span className="font-mono font-semibold">{formatCurrency(sale.subtotal)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between text-red-600 font-semibold">
            <span className="font-sans">Discount:</span>
            <span className="font-mono">-{formatCurrency(sale.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs font-black pt-1 border-t border-gray-300 text-black">
          <span className="font-sans">Total Payable:</span>
          <span className="font-mono text-emerald-800">{formatCurrency(sale.total)}</span>
        </div>
      </div>

      {/* Footer thank you message */}
      <div className="text-center pt-1.5 space-y-0.5">
        <p className="text-[10px] font-semibold text-gray-800 font-sans">Thank you for your visit!</p>
        <p dir="rtl" className="text-[10px] text-gray-600">تشکر از خرید شما</p>
        <p className="font-mono text-[8px] text-gray-400 pt-1 tracking-widest uppercase">*** HESABDAR POS ***</p>
      </div>
    </div>
  )
}

export default ThermalReceipt
