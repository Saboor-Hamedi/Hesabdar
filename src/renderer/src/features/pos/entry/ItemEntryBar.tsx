import { useState, useRef, useEffect, useMemo, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, CornerDownLeft, X } from 'lucide-react'
import type { Product, UnitType } from '../../../core/types'
import { formatCurrency } from '../../../core/utils/formatters'
import { Button } from '../../../components/ui/Button'

interface ItemEntryBarProps {
  products: Product[]
  selectedProduct: Product | null
  searchQuery?: string
  onChangeSearchQuery?: (val: string) => void
  amount: number
  price: number
  unit: UnitType
  onSelectProduct: (product: Product | null) => void
  onChangeAmount: (val: number) => void
  onChangePrice?: (val: number) => void
  onChangeUnit: (val: UnitType) => void
  onAddItem: () => void
  onFastScanAdd?: (product: Product) => void
  onFocusField?: (field: 'amount') => void
  activeField?: string
}

/**
 * Normalizes search text across all languages (Persian/Dari, Pashto, English)
 * and keyboard input methods:
 * - Converts Arabic and Persian numerals (۰-۹ / ٠-٩) to ASCII 0-9
 * - Normalizes Yeh variants (ي, ې, ۍ, ئ, ى) to standard Persian 'ی'
 * - Normalizes Kaf variants (ك, ګ, ک) to standard 'ک'
 * - Normalizes Alef variants (آ, أ, إ, ٱ) to standard 'ا'
 * - Normalizes Teh Marbuta (ة) & Heh variants (ۀ, ہ) to standard 'ه'
 * - Removes Zero-Width Non-Joiners (\u200C / نیم‌فاصله) & zero-width spaces
 * - Strips Arabic diacritics / Tashkeel
 */
export function normalizeSearchTerm(str: string): string {
  if (!str) return ''
  return str
    .toLowerCase()
    .replace(/[۰٠]/g, '0')
    .replace(/[۱١]/g, '1')
    .replace(/[۲٢]/g, '2')
    .replace(/[۳٣]/g, '3')
    .replace(/[۴٤]/g, '4')
    .replace(/[۵٥]/g, '5')
    .replace(/[۶٦]/g, '6')
    .replace(/[۷٧]/g, '7')
    .replace(/[۸٨]/g, '8')
    .replace(/[۹٩]/g, '9')
    .replace(/[\u064A\u0649\u06D0\u06CD\u06D1\u0626]/g, 'ی')
    .replace(/[\u0643\u06A8\u06AB]/g, 'ک')
    .replace(/[\u0622\u0623\u0625\u0671]/g, 'ا')
    .replace(/[\u0629\u06C0\u06C1]/g, 'ه')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .trim()
}

/**
 * ItemEntryBar: High-speed cashier input bar for item search, quantity, unit price, and line total.
 * 2-row layout guarantees that the Add Item button and Line Total are never cut off or hidden.
 */
export function ItemEntryBar({
  products,
  selectedProduct,
  searchQuery: propSearchQuery,
  onChangeSearchQuery,
  amount,
  price,
  unit,
  onSelectProduct,
  onChangeAmount,
  onChangePrice,
  onChangeUnit,
  onAddItem,
  onFastScanAdd,
}: ItemEntryBarProps) {
  const { t } = useTranslation()
  const [internalQuery, setInternalQuery] = useState('')
  const searchQuery = propSearchQuery !== undefined ? propSearchQuery : internalQuery
  const setSearchQuery = (val: string) => {
    if (onChangeSearchQuery) onChangeSearchQuery(val)
    else setInternalQuery(val)
  }

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const amountInputRef = useRef<HTMLInputElement>(null)

  // Focus search input on initial mount only
  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  // Pre-indexed product search for zero-allocation, instant <1ms response
  const productIndex = useMemo(() => {
    return products.map((p) => {
      const cleanBarcode = normalizeSearchTerm(p.barcode || '')
      const cleanNameFa = normalizeSearchTerm(p.name_fa || '')
      const cleanNameEn = normalizeSearchTerm(p.name_en || '')
      const cleanNamePs = normalizeSearchTerm(p.name_ps || '')
      const cleanCategory = normalizeSearchTerm(p.category_name || '')

      const rawHaystack = [p.barcode, p.name_fa, p.name_en, p.name_ps, p.category_name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const normalizedHaystack = [cleanBarcode, cleanNameFa, cleanNameEn, cleanNamePs, cleanCategory]
        .filter(Boolean)
        .join(' ')

      const tokens = normalizedHaystack.split(/\s+/).filter(Boolean)

      return {
        product: p,
        cleanBarcode,
        cleanNameFa,
        cleanNameEn,
        cleanNamePs,
        rawHaystack,
        normalizedHaystack,
        tokens,
      }
    })
  }, [products])

  // Filter products based on search query (only when user types)
  const filteredProducts = useMemo(() => {
    const rawQ = searchQuery.trim()
    if (!rawQ) return []

    const normQ = normalizeSearchTerm(rawQ)
    const queryTokens = normQ.split(/\s+/).filter(Boolean)

    // Tiered matches
    const exactBarcodes: Product[] = []
    const prefixBarcodes: Product[] = []
    const namePrefixes: Product[] = []
    const allTokensMatch: Product[] = []
    const substringMatches: Product[] = []

    for (const entry of productIndex) {
      // 1. Exact barcode / SKU match (highest priority for barcode scanners)
      if (entry.cleanBarcode && (entry.cleanBarcode === normQ || entry.product.barcode === rawQ)) {
        exactBarcodes.push(entry.product)
        continue
      }

      // 2. Barcode prefix match
      if (entry.cleanBarcode && entry.cleanBarcode.startsWith(normQ)) {
        prefixBarcodes.push(entry.product)
        continue
      }

      // 3. Name starts with query
      if (
        entry.cleanNameFa.startsWith(normQ) ||
        entry.cleanNameEn.startsWith(normQ) ||
        entry.cleanNamePs.startsWith(normQ)
      ) {
        namePrefixes.push(entry.product)
        continue
      }

      // 4. All query tokens matched in any order
      if (queryTokens.length > 1 && queryTokens.every((t) => entry.normalizedHaystack.includes(t))) {
        allTokensMatch.push(entry.product)
        continue
      }

      // 5. General substring match in normalized or raw fields
      if (entry.normalizedHaystack.includes(normQ) || entry.rawHaystack.includes(rawQ.toLowerCase())) {
        substringMatches.push(entry.product)
      }
    }

    return [
      ...exactBarcodes,
      ...prefixBarcodes,
      ...namePrefixes,
      ...allTokensMatch,
      ...substringMatches,
    ].slice(0, 20)
  }, [productIndex, searchQuery])

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle choosing a product
  const handlePickProduct = (product: Product) => {
    onSelectProduct(product)
    setSearchQuery('') // Auto-clear per prompt.md requirement
    if (onChangePrice) onChangePrice(product.sell_price)
    onChangeUnit(product.unit || 'pcs')
    setIsDropdownOpen(false)
    // Focus amount input immediately for rapid entry
    setTimeout(() => {
      amountInputRef.current?.focus()
      amountInputRef.current?.select()
    }, 50)
  }

  // Clear product selection
  const handleClearSelection = () => {
    onSelectProduct(null)
    setSearchQuery('')
    if (onChangePrice) onChangePrice(0)
    setIsDropdownOpen(false)
    searchInputRef.current?.focus()
  }

  // Add Item and return focus to search input
  const handleAdd = () => {
    onAddItem()
    setSearchQuery('')
    setIsDropdownOpen(false)
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 50)
  }

  // Key navigation in product search & instant barcode scan handler
  const handleSearchKeyDown = (e: KeyboardEvent) => {
    if (!isDropdownOpen && searchQuery.trim().length > 0) {
      if (e.key === 'ArrowDown') {
        setIsDropdownOpen(true)
        return
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev < filteredProducts.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const rawQ = searchQuery.trim()
      const normQ = normalizeSearchTerm(rawQ)

      // 1. Direct Barcode Scan Detection: Exact barcode or SKU match
      const exactBarcode = products.find(
        (p) => normalizeSearchTerm(p.barcode || '') === normQ || p.barcode === rawQ
      )

      if (exactBarcode) {
        // Fast-track: automatically add 1 unit to cart and stay ready for next scan
        if (onFastScanAdd) {
          onFastScanAdd(exactBarcode)
        } else {
          onSelectProduct(exactBarcode)
          if (onChangePrice) onChangePrice(exactBarcode.sell_price)
          onChangeUnit(exactBarcode.unit || 'pcs')
          onChangeAmount(1)
          onAddItem()
        }
        setSearchQuery('')
        setIsDropdownOpen(false)
        searchInputRef.current?.focus()
        return
      }

      // 2. Select the currently highlighted product
      if (filteredProducts.length > 0) {
        const picked = filteredProducts[highlightedIndex] || filteredProducts[0]
        handlePickProduct(picked)
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false)
    }
  }

  const lineTotal = Math.round(amount * price * 100) / 100

  return (
    <div className="bg-white border border-gray-200/70 rounded-[8px] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col gap-3">
      {/* Row 1: Full-width Item Search & Barcode Lookup */}
      <div className="flex items-center gap-2">
        <div ref={dropdownRef} className="relative flex-1">
          <div className="relative flex items-center">
            <input
              ref={searchInputRef}
              data-testid="pos-item-search"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value
                setSearchQuery(val)
                setIsDropdownOpen(val.trim().length > 0)
                setHighlightedIndex(0)
              }}
              onFocus={() => {
                if (searchQuery.trim().length > 0) {
                  setIsDropdownOpen(true)
                }
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder={`${t('pos.scanPlaceholder')} (F2)`}
              className="w-full h-10 ps-9 pe-8 text-xs rounded-[8px] border border-gray-200/80 bg-[#FAFAFA] text-[#1F2937] placeholder:text-[#9CA3AF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4A7C6F]/20 font-medium transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            />
            <Search className="w-4 h-4 text-[#9CA3AF] absolute start-3 pointer-events-none" />

            {searchQuery ? (
              <button
                type="button"
                onClick={handleClearSelection}
                className="absolute end-2 p-1 text-gray-400 hover:text-gray-600 rounded-[5px]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          {/* Autocomplete Dropdown: only when query is active */}
          {isDropdownOpen && searchQuery.trim().length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-gray-200/80 rounded-[8px] shadow-lg max-h-56 overflow-y-auto divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-100">
              {filteredProducts.length === 0 ? (
                <div className="p-3 text-center text-xs text-[#9CA3AF]">
                  <p>No matching commodity found.</p>
                </div>
              ) : (
                filteredProducts.map((p, idx) => {
                  const isHighlighted = idx === highlightedIndex
                  const isSelected = selectedProduct?.id === p.id
                  const isLow = p.stock_qty <= (p.reorder_level || 5)

                  return (
                    <div
                      key={p.id}
                      onClick={() => handlePickProduct(p)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`p-2.5 flex items-center justify-between cursor-pointer text-xs transition-colors ${
                        isHighlighted
                          ? 'bg-[#4A7C6F]/10 text-[#1F2937]'
                          : isSelected
                            ? 'bg-gray-50 font-medium'
                            : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#1F2937] truncate">
                            {p.name_fa}
                          </span>
                          {p.name_en && (
                            <span className="text-[10px] text-[#9CA3AF] truncate">
                              ({p.name_en})
                            </span>
                          )}
                          <span className="text-[9px] px-1.5 py-0.2 rounded-[4px] bg-gray-100 text-[#6B7280] uppercase font-mono">
                            {p.unit}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[#9CA3AF] font-mono mt-0.5">
                          <span>{p.barcode || `#${p.id}`}</span>
                          <span>•</span>
                          <span className={isLow ? 'text-amber-700 font-medium' : ''}>
                            Stock: {p.stock_qty} {p.unit}
                          </span>
                        </div>
                      </div>

                      <div className="text-end shrink-0">
                        <span className="font-mono font-medium text-xs text-[#1F2937] block">
                          {formatCurrency(p.sell_price)}
                        </span>
                        <span className="text-[9px] text-[#9CA3AF]">per {p.unit}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Staged Product Indicator (Visible when item is chosen) */}
      {selectedProduct && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#4A7C6F]/10 border border-[#4A7C6F]/20 rounded-[7px] text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-[#2E4F46] truncate">
              {selectedProduct.name_fa || selectedProduct.name_en}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-gray-600 font-mono border border-gray-200">
              {selectedProduct.barcode || `#${selectedProduct.id}`}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearSelection}
            className="text-[11px] text-gray-400 hover:text-rose-600 p-0.5 rounded cursor-pointer transition-colors"
            title="Clear selection"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Row 2: Merged Cohesive Toolbar (Qty + Unit Price + Line Total) + Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Unified Toolbar with internal dividers */}
        <div className="flex-1 h-10 rounded-[8px] bg-[#FAFAFA] border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-stretch divide-x divide-gray-200/70 rtl:divide-x-reverse overflow-hidden">
          {/* Part 1: Quantity input */}
          <div className="flex-1 px-3 flex items-center justify-between min-w-[110px]">
            <span className="text-[11px] text-[#6B7280] font-medium tracking-wide shrink-0 select-none">
              {t('pos.qty')}
            </span>
            <input
              ref={amountInputRef}
              type="number"
              step="any"
              min="0.01"
              value={amount || ''}
              onChange={(e) => onChangeAmount(Math.max(0, parseFloat(e.target.value) || 0))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAdd()
                }
              }}
              placeholder="1"
              className="w-16 text-center text-xs font-mono font-medium text-[#1F2937] bg-transparent focus:outline-none"
            />
            <span className="text-[10px] text-[#9CA3AF] uppercase font-mono shrink-0 select-none">
              {unit}
            </span>
          </div>

          {/* Part 2: Unit Price (Clean readout) */}
          <div className="flex-1 px-3 flex flex-col justify-center select-none min-w-[95px]">
            <span className="text-[9px] text-[#9CA3AF] uppercase font-medium tracking-wider leading-tight">
              {t('pos.unitPrice')}
            </span>
            <span className="font-mono text-xs text-[#1F2937] font-medium truncate leading-tight mt-0.5">
              {price ? formatCurrency(price) : '0 AFN'}
            </span>
          </div>

          {/* Part 3: Line Total (Clean subtle highlight) */}
          <div className="flex-1 px-3 flex flex-col justify-center select-none min-w-[95px] bg-[#F3F4F6]/50">
            <span className="text-[9px] text-[#6B7280] uppercase font-medium tracking-wider leading-tight">
              {t('pos.lineTotal')}
            </span>
            <span className="font-mono text-xs font-semibold text-[#1F2937] truncate leading-tight mt-0.5">
              {lineTotal ? formatCurrency(lineTotal) : '0 AFN'}
            </span>
          </div>
        </div>

        {/* Add Item Button: Refined Sage Teal CTA */}
        <Button
          variant="primary"
          onClick={handleAdd}
          disabled={!selectedProduct || amount <= 0 || price < 0}
          icon={<CornerDownLeft className="w-3.5 h-3.5" />}
          className="h-10 px-4 text-xs font-medium rounded-[8px] shrink-0 justify-center shadow-xs"
        >
          {t('pos.addItem')}
        </Button>
      </div>
    </div>
  )
}

export default ItemEntryBar
