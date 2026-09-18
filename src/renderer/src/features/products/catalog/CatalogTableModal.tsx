import { useState, useMemo, useEffect, useCallback } from 'react'
import { Search, Plus, Check, X, ArrowUpRight, Package } from 'lucide-react'
import {
  initAndGetCatalog,
  type CatalogItem
} from '../../../core/products/catalogData'
import type { Product } from '../../../core/types'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { notify } from '../../../core/notifications'
import { addProduct } from '../../../core/store'

interface CatalogTableModalProps {
  isOpen: boolean
  onClose: () => void
  existingProducts: Product[]
  onSelectForCustomize?: (item: CatalogItem) => void
}

/** Normalized search index entry — built once when catalog loads, never rebuilt on search */
interface IndexEntry {
  item: CatalogItem
  /** Single pre-lowercased string: "name_en|name_fa|name_ps|barcode|category" */
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

export function CatalogTableModal({
  isOpen,
  onClose,
  existingProducts,
  onSelectForCustomize,
}: CatalogTableModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [recentlyAddedIds, setRecentlyAddedIds] = useState<Set<string>>(new Set())
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([])
  const [searchIndex, setSearchIndex] = useState<IndexEntry[]>([])

  // Load from disk once per open; build index immediately after
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    initAndGetCatalog().then((items) => {
      if (cancelled) return
      setCatalogItems(items)
      setSearchIndex(buildIndex(items))
    })
    return () => { cancelled = true }
  }, [isOpen])

  // Distinct categories — derived from the loaded items, not recomputed on every search
  const categories = useMemo(() => {
    const seen = new Set<string>()
    catalogItems.forEach((it) => seen.add(it.category))
    return ['All', ...Array.from(seen)]
  }, [catalogItems])

  // O(1) inventory lookup by barcode+name — pre-built Set for instant membership test
  const inventorySet = useMemo(() => {
    const set = new Set<string>()
    existingProducts.forEach((p) => {
      if (p.barcode) set.add(`bc:${p.barcode}`)
      if (p.name_fa) set.add(`fa:${p.name_fa.trim().toLowerCase()}`)
      if (p.name_en) set.add(`en:${p.name_en.trim().toLowerCase()}`)
    })
    return set
  }, [existingProducts])

  const isItemInInventory = useCallback((item: CatalogItem): boolean => {
    if (recentlyAddedIds.has(item.id)) return true
    return (
      (!!item.barcode && inventorySet.has(`bc:${item.barcode}`)) ||
      inventorySet.has(`fa:${item.name_fa.trim().toLowerCase()}`) ||
      (!!item.name_en && inventorySet.has(`en:${item.name_en.trim().toLowerCase()}`))
    )
  }, [recentlyAddedIds, inventorySet])

  // Fast search: single-pass over the pre-built index, one contains() call per item
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const byCategory = selectedCategory === 'All'
      ? searchIndex
      : searchIndex.filter((e) => e.item.category === selectedCategory)
    if (!q) return byCategory.map((e) => e.item)
    return byCategory.filter((e) => e.haystack.includes(q)).map((e) => e.item)
  }, [searchQuery, selectedCategory, searchIndex])

  // One-click quick add into store
  const handleQuickAdd = (item: CatalogItem) => {
    try {
      addProduct({
        barcode: item.barcode,
        name_fa: item.name_fa,
        name_ps: item.name_ps,
        name_en: item.name_en,
        category_name: item.category,
        unit: item.unit,
        cost_price: item.suggested_cost,
        sell_price: item.suggested_price,
        stock_qty: item.default_stock,
        reorder_level: 10,
      })

      setRecentlyAddedIds((prev) => new Set([...prev, item.id]))

      notify({
        type: 'success',
        title: 'Item Added / جنس اضافه شد',
        message: `${item.name_fa} (${item.name_en}) added to inventory with stock ${item.default_stock} ${item.unit}.`,
      })
    } catch (err) {
      console.error(err)
      notify({
        type: 'error',
        title: 'Failed to Add Item',
        message: 'Could not register catalog commodity into inventory.',
      })
    }
  }

  const handleCustomize = (item: CatalogItem) => {
    onClose()
    onSelectForCustomize?.(item)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Standard Commodity Catalog"
      subtitle="Pre-configured Afghan commodities with English, Dari, and Pashto names, units, and standard market pricing."
      badge={
        <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 shadow-2xs">
          {catalogItems.length} Commodities
        </span>
      }
      style={{ width: '940px', maxWidth: '95vw', height: '700px', maxHeight: '92vh' }}
      className="flex flex-col"
      bodyClassName="flex-1 flex flex-col p-8 overflow-hidden min-h-0"
    >
      <div className="flex flex-col h-full min-h-0 gap-4">
        {/* Top Header Card matching DebtPaymentModal */}
        <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#5A8F7B] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900">Standard Commodity Presets</span>
              <span className="text-xs text-gray-500 mt-0.5">
                Instant one-click add to inventory or open in form to customize pricing
              </span>
            </div>
          </div>

          <div className="text-end shrink-0">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-[0.05em] block">
              Inventory In Stock
            </span>
            <span className="text-sm font-bold font-mono text-emerald-800 mt-0.5 block">
              {existingProducts.length} Active Items
            </span>
          </div>
        </div>

        {/* Prominent Full-Width Search Input */}
        <div className="relative w-full shrink-0">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search commodity by English name, نام دری, نوم په پښتو, barcode (1001-1028), or category..."
            className="w-full h-10 pl-10 pr-9 text-xs bg-gray-50 hover:bg-gray-100/70 focus:bg-white rounded-xl border border-gray-200 focus:border-[#5A8F7B] focus:ring-2 focus:ring-[#5A8F7B]/20 outline-none transition-all placeholder:text-gray-400 shadow-2xs"
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none shrink-0">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs font-medium px-3 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#5A8F7B] text-white shadow-2xs font-semibold'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Fixed Height Data Table Container */}
        <div className="flex-1 min-h-0 overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#F8F9FA] sticky top-0 z-10 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px] font-semibold select-none">
              <tr>
                <th className="py-2.5 px-3 w-16">Barcode</th>
                <th className="py-2.5 px-3">Commodity Names (English / دری / پښتو)</th>
                <th className="py-2.5 px-3 w-28">Category</th>
                <th className="py-2.5 px-3 w-16 text-center">Unit</th>
                <th className="py-2.5 px-3 w-24 text-right">Cost (AFN)</th>
                <th className="py-2.5 px-3 w-24 text-right">Price (AFN)</th>
                <th className="py-2.5 px-3 w-36 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <p className="text-xs">No commodities matching &quot;{searchQuery}&quot;</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const inInventory = isItemInInventory(item)
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/80 transition-colors group"
                    >
                      <td className="py-2.5 px-3 font-mono text-[11px] text-gray-500 font-medium">
                        {item.barcode}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-gray-900">{item.name_fa}</span>
                          <span className="text-[11px] text-gray-500">/ {item.name_en}</span>
                          <span className="text-[11px] text-gray-400">({item.name_ps})</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-mono text-[11px] text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200/50">
                          {item.unit}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[11px] text-gray-600">
                        {item.suggested_cost}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[11px] font-semibold text-emerald-800">
                        {item.suggested_price}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {inInventory ? (
                            <div className="flex items-center gap-1 text-[11px] text-emerald-800 font-medium bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200/60">
                              <Check className="w-3.5 h-3.5 text-emerald-700" />
                              <span>In Store</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleQuickAdd(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md bg-[#5A8F7B] hover:bg-[#4a7766] text-white shadow-2xs transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleCustomize(item)}
                            title="Open in form to edit price/stock"
                            className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Actions matching DebtPaymentModal */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 shrink-0">
          <span className="text-[11px] text-gray-400">
            Showing {filteredItems.length} of {catalogItems.length} standard commodities • Click Add to register instantly
          </span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
