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

  // Filter products based on search query (only when user types)
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase().trim()
    return products
      .filter((p) => {
        const matchBarcode = p.barcode?.toLowerCase().includes(q)
        const matchFa = p.name_fa.toLowerCase().includes(q)
        const matchEn = p.name_en?.toLowerCase().includes(q)
        const matchPs = p.name_ps?.toLowerCase().includes(q)
        const matchCat = p.category_name?.toLowerCase().includes(q)
        return Boolean(matchBarcode || matchFa || matchEn || matchPs || matchCat)
      })
      .slice(0, 15)
  }, [products, searchQuery])

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
    <div className="bg-white border border-gray-200/90 rounded-[5px] p-3 shadow-xs flex flex-col gap-2.5">
      {/* Row 1: Full-width Item Search & Barcode Lookup */}
      <div className="flex items-center gap-2">
        <div ref={dropdownRef} className="relative flex-1">
          <div className="relative flex items-center">
            <input
              ref={searchInputRef}
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
              placeholder="Scan barcode or type commodity name (روغن، برنج، sugar)..."
              className="w-full h-10 ps-9 pe-8 text-xs rounded-[5px] border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 font-medium"
            />
            <Search className="w-4 h-4 text-gray-400 absolute start-3 pointer-events-none" />

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
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-[5px] shadow-xl max-h-56 overflow-y-auto divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <div className="p-3 text-center text-xs text-gray-400">
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
                      className={`p-2 flex items-center justify-between cursor-pointer text-xs transition-colors ${
                        isHighlighted
                          ? 'bg-emerald-50 text-emerald-900'
                          : isSelected
                            ? 'bg-gray-50 font-semibold'
                            : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 truncate">
                            {p.name_fa}
                          </span>
                          {p.name_en && (
                            <span className="text-[10px] text-gray-400 truncate">
                              ({p.name_en})
                            </span>
                          )}
                          <span className="text-[9px] px-1.5 py-0.2 rounded-[3px] bg-gray-100 text-gray-600 uppercase font-mono">
                            {p.unit}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono mt-0.5">
                          <span>{p.barcode || `#${p.id}`}</span>
                          <span>•</span>
                          <span className={isLow ? 'text-amber-600 font-medium' : ''}>
                            Stock: {p.stock_qty} {p.unit}
                          </span>
                        </div>
                      </div>

                      <div className="text-end shrink-0">
                        <span className="font-mono font-bold text-xs text-emerald-700 block">
                          {formatCurrency(p.sell_price)}
                        </span>
                        <span className="text-[9px] text-gray-400">per {p.unit}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: 4-Column Balanced Grid: Qty, Unit Price, Line Total, Add Button */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
        {/* Col 1: Quantity with Unit */}
        <div className="flex items-center h-10 border border-gray-300 rounded-[5px] bg-white px-2.5 focus-within:border-emerald-500 shadow-2xs">
          <span className="text-[11px] text-gray-500 font-semibold me-1 shrink-0 select-none">
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
            className="w-full text-center text-xs font-mono font-bold text-gray-900 bg-transparent focus:outline-none"
          />
          <span className="text-[10px] text-gray-400 uppercase font-mono ms-1 shrink-0 select-none">
            {unit}
          </span>
        </div>

        {/* Col 2: Unit Price (Uneditable) */}
        <div className="h-10 bg-gray-50 border border-gray-200 rounded-[5px] px-3 flex flex-col justify-center select-none shadow-2xs">
          <span className="text-[9px] text-gray-400 uppercase font-semibold leading-tight tracking-wider">
            {t('pos.unitPrice')}
          </span>
          <span className="font-mono font-bold text-xs text-gray-800 truncate leading-tight">
            {price ? formatCurrency(price) : '0 AFN'}
          </span>
        </div>

        {/* Col 3: Line Total (Uneditable) */}
        <div className="h-10 bg-emerald-50/70 border border-emerald-300 rounded-[5px] px-3 flex flex-col justify-center select-none shadow-2xs">
          <span className="text-[9px] text-emerald-800 uppercase font-bold leading-tight tracking-wider">
            {t('pos.lineTotal')}
          </span>
          <span className="font-mono font-black text-xs text-emerald-800 truncate leading-tight">
            {lineTotal ? formatCurrency(lineTotal) : '0 AFN'}
          </span>
        </div>

        {/* Col 4: Add to Invoice Button */}
        <Button
          variant="primary"
          onClick={handleAdd}
          disabled={!selectedProduct || amount <= 0 || price < 0}
          icon={<CornerDownLeft className="w-4 h-4" />}
          className="h-10 text-xs font-bold w-full justify-center shadow-xs"
        >
          {t('pos.addItem')}
        </Button>
      </div>
    </div>
  )
}

export default ItemEntryBar
