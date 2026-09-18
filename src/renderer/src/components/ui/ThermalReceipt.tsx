import { useTranslation } from 'react-i18next'
import type { Sale, SaleItem } from '../../core/types'
import { formatCurrency, formatDateTime } from '../../core/utils/formatters'

export interface PrintableSaleData {
  invoice_no: string
  created_at: string
  customer_name?: string | null
  customer_phone?: string | null
  payment_mode: string
  items: SaleItem[]
  subtotal: number
  discount: number
  total: number
  paid?: number
  due?: number
}

interface ThermalReceiptProps {
  sale: Sale | PrintableSaleData
  shopName?: string
  shopPhone?: string
  shopAddress?: string
  className?: string
  showSerratedEdge?: boolean
}

/**
 * ThermalReceipt:
 * Authentic 80mm POS thermal receipt layout.
 * Optimized for high item counts (100+ items) with dedicated price column,
 * subtle alternating zebra striping, tabular figures, and crisp thermal dashed dividers.
 */
export function ThermalReceipt({
  sale,
  shopName: propShopName,
  shopPhone: propShopPhone,
  shopAddress: propShopAddress,
  className = '',
  showSerratedEdge = true,
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

  const shopName = propShopName || cachedProfile?.storeName || t('app.name', 'HESABDAR')
  const shopPhone = propShopPhone || cachedProfile?.phone || ''
  const shopAddress = propShopAddress || cachedProfile?.address || ''
  const items = sale.items || []

  return (
    <div
      id="printable-receipt"
      className={`bg-white text-gray-950 font-mono text-[11px] leading-snug w-full select-none ${className}`}
    >
      {/* ── 1. Store Header ───────────────────────────────────────── */}
      <div className="text-center pb-2.5 mb-2.5 border-b-2 border-dashed border-gray-400">
        <h2 className="text-[16px] font-black tracking-wider uppercase font-sans text-gray-950">
          {shopName}
        </h2>
        <p className="text-[10px] font-medium text-gray-500 font-sans tracking-wide">POS RETAIL &amp; ACCOUNTING</p>
        {shopAddress && <p className="text-[10px] text-gray-600 font-sans mt-0.5">{shopAddress}</p>}
        {shopPhone && <p className="text-[10.5px] text-gray-700 font-mono mt-0.5 font-semibold">Tel: {shopPhone}</p>}
      </div>

      {/* ── 2. Invoice Metadata ───────────────────────────────────── */}
      <div className="flex flex-col gap-1 text-[11px] pb-2.5 mb-2.5 border-b border-dashed border-gray-300">
        <div className="flex justify-between items-center">
          <span className="text-gray-500 font-sans uppercase text-[10px] font-bold">Invoice:</span>
          <span className="font-mono font-black text-gray-950 text-xs tracking-wide">#{sale.invoice_no}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 font-sans text-[10px]">Date &amp; Time:</span>
          <span className="font-mono text-gray-700 font-medium">{formatDateTime(sale.created_at)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 font-sans text-[10px]">Payment Mode:</span>
          <span className="font-mono font-bold uppercase text-emerald-800 text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            {sale.payment_mode}
          </span>
        </div>
        {'customer_name' in sale && sale.customer_name && (
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-sans text-[10px]">Customer:</span>
            <span className="font-sans font-bold text-gray-900 truncate max-w-[200px]">
              {sale.customer_name}
            </span>
          </div>
        )}
      </div>

      {/* ── 3. Line Items Table (Balanced 5-Column Grid) ─────────── */}
      <div className="pb-2 mb-2 border-b-2 border-dashed border-gray-400">
        {/* Table Column Headers */}
        <div className="grid grid-cols-12 text-[10px] font-sans font-bold uppercase text-gray-600 pb-1.5 border-b border-gray-300">
          <span className="col-span-1 text-gray-400">#</span>
          <span className="col-span-5 text-start">Description</span>
          <span className="col-span-2 text-center">Qty</span>
          <span className="col-span-2 text-end">Price</span>
          <span className="col-span-2 text-end">Total</span>
        </div>

        {/* Table Rows (Handles 100+ items smoothly) */}
        <div className="divide-y divide-gray-100">
          {items.map((it, idx) => (
            <div
              key={idx}
              className={`py-1.5 grid grid-cols-12 items-baseline text-[11px] ${
                items.length > 15 && idx % 2 === 1 ? 'bg-gray-50/75 -mx-1 px-1 rounded-xs' : ''
              }`}
            >
              {/* Index */}
              <span className="col-span-1 font-mono text-[9.5px] text-gray-400">
                {idx + 1}
              </span>

              {/* Product Name */}
              <div className="col-span-5 pr-1 font-sans font-medium text-gray-950 text-[11px] leading-snug break-words">
                {it.product_name || 'Item'}
              </div>

              {/* Qty + Unit */}
              <div className="col-span-2 text-center font-mono text-gray-800 text-[10.5px]">
                <span className="font-semibold">{it.qty}</span>
                {it.unit && <span className="text-[9px] text-gray-400 ms-0.5">{it.unit}</span>}
              </div>

              {/* Unit Price */}
              <div className="col-span-2 text-end font-mono text-gray-600 text-[10px]">
                {formatCurrency(it.unit_price)}
              </div>

              {/* Line Total */}
              <div className="col-span-2 text-end font-mono font-bold text-gray-950 text-[11px]">
                {formatCurrency(it.line_total)}
              </div>
            </div>
          ))}
        </div>

        {/* Total Lines Counter */}
        <div className="flex justify-between items-center pt-2 mt-1 border-t border-dashed border-gray-200 text-[10px] text-gray-500">
          <span>Items Count:</span>
          <span className="font-mono font-bold text-gray-800">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
        </div>
      </div>

      {/* ── 4. Totals & Financial Summary ─────────────────────────── */}
      <div className="flex flex-col gap-1.5 text-[11.5px] pb-2.5 mb-2.5 border-b-2 border-dashed border-gray-400">
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
        {'paid' in sale && sale.paid !== undefined && sale.paid > 0 && (
          <div className="flex justify-between text-gray-600 text-[11px]">
            <span className="font-sans">Paid Amount:</span>
            <span className="font-mono font-semibold text-emerald-800">{formatCurrency(sale.paid)}</span>
          </div>
        )}
        {'due' in sale && sale.due !== undefined && sale.due > 0 && (
          <div className="flex justify-between text-rose-700 font-bold text-[11px]">
            <span className="font-sans">Remaining Due:</span>
            <span className="font-mono">{formatCurrency(sale.due)}</span>
          </div>
        )}

        {/* GRAND TOTAL: High-Contrast Bold Thermal Bar */}
        <div className="flex justify-between items-baseline pt-2 pb-1.5 mt-1 border-t-2 border-b-2 border-gray-950">
          <span className="font-sans font-black uppercase tracking-wider text-gray-950 text-xs">
            TOTAL PAYABLE:
          </span>
          <span className="font-mono text-[18px] font-black text-gray-950 tracking-tight">
            {formatCurrency(sale.total)}
          </span>
        </div>
      </div>

      {/* ── 5. Simulated Barcode & Customer Message ─────────────────── */}
      <div className="text-center pt-1.5 space-y-1.5">
        {/* Simulated Code-128 Barcode */}
        <div className="flex flex-col items-center justify-center pt-1">
          <div className="flex items-center gap-[1.5px] h-7 overflow-hidden">
            {[2, 1, 3, 1, 2, 2, 1, 3, 1, 2, 1, 4, 1, 2, 3, 1, 1, 2, 3, 2, 1, 2, 1, 3, 2, 1, 2, 1, 3, 1, 2, 2, 1, 3, 1, 2, 1, 3].map(
              (w, i) => (
                <div key={i} className="bg-gray-950 h-full" style={{ width: `${w}px` }} />
              )
            )}
          </div>
          <span className="font-mono text-[9.5px] text-gray-600 tracking-widest mt-0.5 font-bold">
            *{sale.invoice_no}*
          </span>
        </div>

        <p className="text-[11px] font-bold text-gray-800 font-sans">
          Thank you for your business!
        </p>
        <p dir="rtl" className="text-[11.5px] font-bold text-gray-700 font-sans">
          تشکر از خرید و اعتماد شما
        </p>
        <p className="font-mono text-[8.5px] text-gray-400 tracking-widest uppercase pt-0.5">
          *** HESABDAR POS SYSTEM ***
        </p>
      </div>

      {/* ── 6. Bottom Serrated Tear Edge ──────────────────────────── */}
      {showSerratedEdge && (
        <div className="w-full overflow-hidden leading-none pt-4 select-none no-print">
          <svg
            className="w-full h-2.5 text-gray-200 fill-current"
            viewBox="0 0 300 8"
            preserveAspectRatio="none"
          >
            <path d="M0,0 L5,8 L10,0 L15,8 L20,0 L25,8 L30,0 L35,8 L40,0 L45,8 L50,0 L55,8 L60,0 L65,8 L70,0 L75,8 L80,0 L85,8 L90,0 L95,8 L100,0 L105,8 L110,0 L115,8 L120,0 L125,8 L130,0 L135,8 L140,0 L145,8 L150,0 L155,8 L160,0 L165,8 L170,0 L175,8 L180,0 L185,8 L190,0 L195,8 L200,0 L205,8 L210,0 L215,8 L220,0 L225,8 L230,0 L235,8 L240,0 L245,8 L250,0 L255,8 L260,0 L265,8 L270,0 L275,8 L280,0 L285,8 L290,0 L295,8 L300,0 Z" />
          </svg>
        </div>
      )}
    </div>
  )
}

export default ThermalReceipt
