import { useState, useMemo, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus, Check, ArrowUpRight, Package, ArrowLeft } from 'lucide-react'
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
  onBackToProductModal?: () => void
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
  onBackToProductModal,
}: CatalogTableModalProps) {
  const { t } = useTranslation()
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
      title={t('products.browseCatalog', 'Standard Commodity Catalog')}
      subtitle="Pre-configured Afghan commodities with English, Dari, and Pashto names, units, and standard market pricing."
      badge={
        <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs">
          {catalogItems.length} Commodities
        </span>
      }
      style={{ width: '920px', maxWidth: '95vw', height: '688px', maxHeight: '92vh' }}
      className="flex flex-col"
      bodyClassName="flex-1 flex flex-col p-8 overflow-hidden min-h-0"
    >
      <div className="flex flex-col h-full min-h-0 gap-3.5">
        {/* Top Profile Header Card matching ProductModal */}
        <div className="p-4 bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#5A8F7B] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-900 dark:text-slate-100">Standard Commodity Presets</span>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                <span>Trilingual Afghan Catalog</span>
                <span>•</span>
                <span>One-Click Add to Store</span>
              </div>
            </div>
          </div>

          <div className="text-end shrink-0">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-[0.05em] block">
              Inventory in Stock
            </span>
            <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5 block">
              {existingProducts.length} Active Items
            </span>
          </div>
        </div>

        {/* Search & Category Filter Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search commodity by English name, نام دری, نوم په پښتو, barcode, category..."
              className="w-full h-8.5 pl-8.5 pr-8 text-xs bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-lg border border-gray-200 dark:border-slate-700 focus:border-[#5A8F7B] focus:bg-white dark:focus:bg-slate-850 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none shrink-0 py-0.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-[5px] transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#5A8F7B] text-white shadow-2xs font-semibold'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200/80 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table Container */}
        <div className="flex-1 min-h-0 overflow-y-auto border border-gray-100 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-gray-50 dark:bg-slate-800/80 sticky top-0 z-10 border-b border-gray-100 dark:border-slate-800 text-gray-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold select-none">
              <tr>
                <th className="py-2 px-3 w-16">Barcode</th>
                <th className="py-2 px-3">Commodity Names (دری / English / پښتو)</th>
                <th className="py-2 px-3 w-28">Category</th>
                <th className="py-2 px-3 w-16 text-center">Unit</th>
                <th className="py-2 px-3 w-20 text-right">Cost</th>
                <th className="py-2 px-3 w-20 text-right">Price</th>
                <th className="py-2 px-3 w-28 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800/80">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-gray-400 dark:text-slate-500">
                    <p className="text-xs">No commodities matching &quot;{searchQuery}&quot;</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const inInventory = isItemInInventory(item)
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-slate-800/60 transition-colors group"
                    >
                      <td className="py-2 px-3 font-mono text-[11px] text-gray-400 dark:text-slate-500 font-medium">
                        {item.barcode}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-gray-900 dark:text-slate-100">{item.name_fa}</span>
                          <span className="text-[11px] text-gray-500 dark:text-slate-400">/ {item.name_en}</span>
                          <span className="text-[11px] text-gray-400 dark:text-slate-500">({item.name_ps})</span>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-[5px] bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200/40 dark:border-slate-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className="font-mono text-[10px] text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 px-1.5 py-0.5 rounded-[5px] border border-gray-200/50 dark:border-slate-700">
                          {item.unit}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-[11px] text-gray-500 dark:text-slate-400">
                        {item.suggested_cost}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        {item.suggested_price}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {inInventory ? (
                            <div className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-[5px] border border-emerald-200/60 dark:border-emerald-800/60">
                              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>In Store</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleQuickAdd(item)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-[5px] bg-[#5A8F7B] hover:bg-[#4A7C6F] text-white shadow-2xs transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleCustomize(item)}
                            title="Open in form to edit price/stock"
                            className="p-1 rounded-[5px] text-gray-400 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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

        {/* Modal Actions matching ProductModal */}
        <div className="flex items-center justify-between pt-3.5 border-t border-gray-100 dark:border-slate-800 shrink-0">
          <span className="text-[11px] text-gray-400 dark:text-slate-400">
            Showing {filteredItems.length} of {catalogItems.length} standard commodities • Click Add to register instantly
          </span>
          <div className="flex items-center gap-2.5">
            {onBackToProductModal && (
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  onClose()
                  onBackToProductModal()
                }}
                icon={<ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />}
              >
                Back to Product Form
              </Button>
            )}
            <Button variant="ghost" type="button" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
