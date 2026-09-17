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
      className="bg-[#F9FAFB] text-gray-900 font-mono text-[12px] leading-normal p-4 w-full rounded-xl border border-gray-200/80 shadow-xs"
    >
      {/* Receipt Header */}
      <div className="text-center pb-3 mb-3 border-b border-gray-200">
        <h2 className="text-base font-bold tracking-wide uppercase font-sans text-gray-950">
          {shopName || 'HESABDAR'}
        </h2>
        <p className="text-[11px] text-gray-600 font-sans">Advanced Shop &amp; Accounting System</p>
        {shopAddress && <p className="text-[11px] text-gray-500 font-sans">{shopAddress}</p>}
        {shopPhone && <p className="text-[11px] text-gray-600 font-mono">Tel: {shopPhone}</p>}
      </div>

      {/* Invoice Meta */}
      <div className="flex flex-col gap-1 text-[11px] pb-3 mb-3 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <span className="font-semibold font-sans text-gray-500 uppercase text-[10px] tracking-wider">Invoice:</span>
          <span className="font-mono font-bold text-gray-900">#{sale.invoice_no}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-sans text-gray-500">Date &amp; Time:</span>
          <span className="font-mono text-gray-700">{formatDateTime(sale.created_at)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-sans text-gray-500">Payment:</span>
          <span className="font-mono font-bold uppercase text-emerald-800">{sale.payment_mode}</span>
        </div>
        {'customer_name' in sale && sale.customer_name && (
          <div className="flex justify-between items-center">
            <span className="font-sans text-gray-500">Customer:</span>
            <span className="font-sans font-semibold text-gray-900">{sale.customer_name}</span>
          </div>
        )}
      </div>

      {/* Line Items Table */}
      <div className="pb-3 mb-3 border-b border-gray-200">
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="border-b border-gray-200 pb-1.5 font-sans text-gray-500 text-[10px] uppercase font-semibold">
              <th className="py-1 font-semibold text-start">Item</th>
              <th className="py-1 text-center font-semibold">Qty</th>
              <th className="py-1 text-end font-semibold">Price</th>
              <th className="py-1 text-end font-semibold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sale.items?.map((it, idx) => (
              <tr key={idx}>
                <td className="py-1.5 text-start pr-1 font-sans">
                  <div className="font-medium text-gray-900 leading-snug">{it.product_name}</div>
                </td>
                <td className="py-1.5 text-center font-mono align-top text-gray-600">
                  {it.qty} {it.unit || ''}
                </td>
                <td className="py-1.5 text-end font-mono align-top text-gray-600">
                  {formatCurrency(it.unit_price)}
                </td>
                <td className="py-1.5 text-end font-mono font-bold align-top text-gray-950">
                  {formatCurrency(it.line_total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Calculation */}
      <div className="flex flex-col gap-1.5 text-[12px] pb-3 mb-3 border-b border-gray-200">
        <div className="flex justify-between text-gray-600">
          <span className="font-sans">Subtotal:</span>
          <span className="font-mono font-semibold text-gray-900">{formatCurrency(sale.subtotal)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between text-rose-600 font-semibold">
            <span className="font-sans">Discount:</span>
            <span className="font-mono">-{formatCurrency(sale.discount)}</span>
          </div>
        )}
        <div className="flex justify-between items-baseline text-sm pt-2 border-t border-gray-300">
          <span className="font-sans font-bold uppercase tracking-wide text-gray-700">Total Payable:</span>
          <span className="font-mono text-[18px] font-black text-gray-950 tracking-tight">{formatCurrency(sale.total)}</span>
        </div>
      </div>

      {/* Footer thank you message */}
      <div className="text-center pt-2 space-y-1">
        <p className="text-[11px] font-semibold text-gray-800 font-sans">Thank you for your visit!</p>
        <p dir="rtl" className="text-xs font-semibold text-gray-700">تشکر از خرید شما</p>
        <p className="font-mono text-[9px] text-gray-400 pt-1 tracking-widest uppercase">*** HESABDAR POS ***</p>
      </div>
    </div>
  )
}

export default ThermalReceipt
