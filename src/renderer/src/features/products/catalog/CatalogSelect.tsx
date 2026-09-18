import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, ChevronDown, Check, X } from 'lucide-react'
import { COMMON_CATALOG_ITEMS, type CatalogItem } from '../../../core/products/catalogData'

interface CatalogSelectProps {
  onSelect: (item: CatalogItem) => void
  selectedItemName?: string
}

/**
 * CatalogSelect: Fast, lightweight searchable select combobox for goods & commodity presets.
 * Searches across English, Persian/Dari, Pashto, and categories with instant response.
 */
export function CatalogSelect({
  onSelect,
  selectedItemName,
}: CatalogSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Filter items across all 3 languages and category
  const filteredItems = useMemo(() => {
    if (!query.trim()) return COMMON_CATALOG_ITEMS
    const q = query.trim().toLowerCase()
    return COMMON_CATALOG_ITEMS.filter(
      (item) =>
        item.name_en.toLowerCase().includes(q) ||
        item.name_fa.toLowerCase().includes(q) ||
        item.name_ps.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    )
  }, [query])

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0)
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredItems[highlightedIndex]) {
        handleSelectItem(filteredItems[highlightedIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
    }
  }

  const handleSelectItem = (item: CatalogItem) => {
    onSelect(item)
    setIsOpen(false)
    setQuery('')
  }

  return (
    <div ref={containerRef} className="relative w-full text-xs" onKeyDown={handleKeyDown}>
      <label className="text-[11px] font-semibold text-gray-700 mb-1 flex items-center justify-between">
        <span className="text-emerald-800 font-semibold">
          Quick Catalog Preset (Auto-fills English, Persian, Pashto &amp; Unit)
        </span>
        <span className="text-[10px] font-normal text-gray-400">
          {COMMON_CATALOG_ITEMS.length} commodities available
        </span>
      </label>

      {/* Select Trigger Box */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between w-full h-9 px-3 rounded-[5px] border cursor-pointer select-none transition-colors
          ${isOpen ? 'border-emerald-500 ring-1 ring-emerald-400 bg-white' : 'border-gray-300 bg-white hover:border-gray-400'}
        `}
      >
        <div className="flex items-center gap-2 truncate">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          {selectedItemName ? (
            <span className="font-semibold text-gray-800 truncate">
              {selectedItemName}
            </span>
          ) : (
            <span className="text-gray-400 truncate">
              Type or select item (e.g. Oil, Rice, Sugar, Flour, Tea, Milk...)...
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-gray-400 shrink-0">
          {selectedItemName && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setQuery('')
              }}
              className="p-0.5 hover:text-gray-600 rounded-[5px]"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Fast Searchable Dropdown Popup */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-[5px] shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Live Search Input */}
          <div className="p-2 border-b border-gray-100 bg-gray-50/70 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setHighlightedIndex(0)
              }}
              placeholder="Search by English, Persian (روغن), Pashto (غوړي)..."
              className="w-full bg-transparent text-xs text-gray-800 placeholder-gray-400 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Items List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-gray-50 p-1">
            {filteredItems.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400">
                No matching commodities found for &ldquo;{query}&rdquo;
              </div>
            ) : (
              filteredItems.map((item, index) => {
                const isHighlighted = index === highlightedIndex
                const isSelected = selectedItemName === item.name_en || selectedItemName === item.name_fa

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`
                      flex items-center justify-between p-2 rounded-[5px] cursor-pointer transition-colors text-xs
                      ${isHighlighted ? 'bg-emerald-50 text-emerald-900' : 'hover:bg-gray-50 text-gray-800'}
                    `}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{item.name_en}</span>
                        <span className="text-[10px] text-emerald-700 font-medium">
                          {item.name_fa}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          ({item.name_ps})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-[3px] bg-gray-100 text-gray-600">
                          {item.category}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-[3px] bg-emerald-100/70 text-emerald-800 font-mono">
                          Unit: {item.unit}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center">
                      {isSelected ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <span className="text-[10px] font-medium text-emerald-700 px-2 py-0.5 rounded-[5px] bg-white border border-emerald-200">
                          Select
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer note */}
          <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 flex justify-between items-center">
            <span>Showing {filteredItems.length} of {COMMON_CATALOG_ITEMS.length} commodities</span>
            <span>Use ↑↓ keys and Enter to select</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default CatalogSelect
