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
  onFocusField?: (field: 'amount') => void
  activeField?: string
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

  // Pre-indexed product search for zero-allocation, instant response
  const productIndex = useMemo(() => {
    return products.map((p) => ({
      product: p,
      haystack: [p.barcode, p.name_fa, p.name_en, p.name_ps, p.category_name]
        .filter(Boolean)
        .join('|')
        .toLowerCase()
    }))
  }, [products])

  // Filter products based on search query (only when user types)
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase().trim()
    return productIndex
      .filter((entry) => entry.haystack.includes(q))
      .map((entry) => entry.product)
      .slice(0, 15)
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
    setSearchQuery(product.name_fa || product.name_en || '')
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
    setIsDropdownOpen(false)
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 50)
  }

  // Key navigation in product search
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
      if (filteredProducts.length > 0) {
        // Prioritize exact barcode match if available
        const exactBarcode = filteredProducts.find(
          (p) => p.barcode?.toLowerCase() === searchQuery.trim().toLowerCase()
        )
        handlePickProduct(exactBarcode || filteredProducts[highlightedIndex] || filteredProducts[0])
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
