import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, ChevronDown, Check, X } from 'lucide-react'
import { initAndGetCatalog, type CatalogItem } from '../../../core/products/catalogData'

interface CatalogSelectProps {
  onSelect: (item: CatalogItem) => void
  selectedItemName?: string
}

interface IndexEntry {
  item: CatalogItem
  haystack: string
}

function buildIndex(items: CatalogItem[]): IndexEntry[] {
  return items.map((item) => ({
    item,
    haystack: [item.name_en, item.name_fa, item.name_ps, item.barcode, item.category]
      .join('|')
      .toLowerCase()
  }))
}

/**
 * CatalogSelect: Fast, lightweight searchable select combobox for goods & commodity presets.
 * Powered by SQLite catalog items with pre-indexed search for instant response.
 */
export function CatalogSelect({
  onSelect,
  selectedItemName,
}: CatalogSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([])
  const [searchIndex, setSearchIndex] = useState<IndexEntry[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Load from SQLite on mount
  useEffect(() => {
    let cancelled = false
    initAndGetCatalog().then((items) => {
      if (cancelled) return
      setCatalogItems(items)
      setSearchIndex(buildIndex(items))
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Fast pre-indexed filter across English, Persian, Pashto, barcode, and category
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return catalogItems
    return searchIndex.filter((e) => e.haystack.includes(q)).map((e) => e.item)
  }, [query, searchIndex, catalogItems])

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
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredItems[highlightedIndex]) {
          handleItemSelect(filteredItems[highlightedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        break
    }
  }

  const handleItemSelect = (item: CatalogItem) => {
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
          {catalogItems.length} commodities available
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
            <span className="text-gray-400">Select standard commodity preset...</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {selectedItemName && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onSelect({
                  id: '',
                  barcode: '',
                  name_en: '',
                  name_fa: '',
                  name_ps: '',
                  unit: 'pcs',
                  category: 'General',
                  suggested_cost: 0,
                  suggested_price: 0,
                  default_stock: 0,
                })
              }}
              className="p-0.5 text-gray-400 hover:text-gray-600 rounded"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Search bar inside dropdown */}
          <div className="p-2 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setHighlightedIndex(0)
                }}
                placeholder="Type in English, دری, or پښتو..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Commodity Options List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
            {filteredItems.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-xs">
                No commodity found matching &quot;{query}&quot;
              </div>
            ) : (
              filteredItems.map((item, index) => {
                const isSelected = selectedItemName === item.name_fa || selectedItemName === item.name_en
                const isHighlighted = index === highlightedIndex

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemSelect(item)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`
                      px-3 py-2 cursor-pointer flex items-center justify-between transition-colors
                      ${isHighlighted ? 'bg-emerald-50/60' : 'hover:bg-gray-50'}
                      ${isSelected ? 'bg-emerald-50 font-medium' : ''}
                    `}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 truncate">{item.name_fa}</span>
                        <span className="text-[11px] text-gray-500 truncate">({item.name_en})</span>
                        <span className="text-[10px] text-gray-400 truncate">{item.name_ps}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                        <span className="bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded">{item.category}</span>
                        <span>Unit: {item.unit}</span>
                        <span>Suggested: {item.suggested_price} AFN</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                        {item.barcode}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer note */}
          <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 flex justify-between items-center">
            <span>Showing {filteredItems.length} of {catalogItems.length} commodities</span>
            <span>Use ↑↓ keys and Enter to select</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default CatalogSelect
