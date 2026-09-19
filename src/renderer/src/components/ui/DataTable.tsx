import { useMemo, useState, useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { Pagination } from './Pagination'

/**
 * Column definition for generic DataTable
 */
export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => ReactNode
  sortable?: boolean
  align?: 'start' | 'center' | 'end'
  minWidth?: string
  width?: string
}

/**
 * Props for DataTable component
 */
export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string | number
  searchable?: boolean
  searchPlaceholder?: string
  searchFields?: (keyof T | string)[]
  pageSize?: number
  emptyMessage?: string
  action?: ReactNode
  fullHeight?: boolean
  className?: string
}

/**
 * Sleek, modern DataTable supporting full-viewport layout with sticky header and pinned pagination.
 */
export function DataTable<T>({
  data,
  columns,
  rowKey,
  searchable = false,
  searchPlaceholder,
  searchFields,
  pageSize = 10,
  emptyMessage,
  action,
  fullHeight = true,
  className = '',
}: DataTableProps<T>) {
  const { t } = useTranslation()
  const resolvedPlaceholder = searchPlaceholder || t('common.search')
  const resolvedEmpty = emptyMessage || t('common.noData')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null)
  const [page, setPage] = useState(1)
  const [currentPageSize, setCurrentPageSize] = useState(pageSize || 10)

  // Keep internal page size in sync if prop changes
  useEffect(() => {
    if (pageSize) setCurrentPageSize(pageSize)
  }, [pageSize])

  // Filter data based on search term
  const filtered = useMemo(() => {
    if (!search.trim() || !searchable) return data
    const q = search.toLowerCase()

    return data.filter((row) => {
      const fieldsToCheck = searchFields || columns.map((c) => String(c.key))
      return fieldsToCheck.some((f) => {
        const val = (row as Record<string, unknown>)[String(f)]
        return val != null && String(val).toLowerCase().includes(q)
      })
    })
  }, [data, search, searchable, searchFields, columns])

  // Sort filtered data
  const sorted = useMemo(() => {
    if (!sort) return filtered
    const { key, dir } = sort
    return [...filtered].sort((a, b) => {
      const av = (a as Record<string, unknown>)[key]
      const bv = (b as Record<string, unknown>)[key]
      if (av === bv) return 0
      if (av == null) return 1
      if (bv == null) return -1
      const r = av > bv ? 1 : -1
      return dir === 'asc' ? r : -r
    })
  }, [filtered, sort])

  // Paginate sorted data
  const paginated = useMemo(() => {
    const start = (page - 1) * currentPageSize
    return sorted.slice(start, start + currentPageSize)
  }, [sorted, page, currentPageSize])

  const alignClass = (a?: Column<T>['align']) =>
    a === 'center' ? 'text-center' : a === 'end' ? 'text-end' : 'text-start'

  return (
    <div
      className={`flex flex-col ${
        fullHeight ? 'flex-1 min-h-0 w-full' : 'gap-2'
      } ${className}`}
    >
      {/* Optional Toolbar with Search and Custom Action */}
      {(searchable || action) && (
        <div className="flex items-center justify-between gap-3 shrink-0 mb-2.5">
          {searchable ? (
            <div className="relative w-64">
              <Search className="absolute start-2.5 top-2.5 w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder={resolvedPlaceholder}
                className="w-full h-8.5 ps-8 pe-2.5 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors shadow-2xs"
              />
            </div>
          ) : (
            <div />
          )}
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      {/* Main Table Wrapper with Sticky Header and Scrollable Body */}
      <div
        className={`rounded-xl border border-gray-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-auto ${
          fullHeight ? 'flex-1 min-h-0' : ''
        }`}
      >
        <table className="w-full border-collapse text-xs min-w-[640px]">
          {/* Sticky Table Header */}
          <thead className="sticky top-0 z-10 bg-gray-50/95 dark:bg-slate-800/95 backdrop-blur-xs text-[11px] font-semibold text-gray-600 dark:text-slate-300 border-b border-gray-200 dark:border-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <tr>
              {columns.map((c) => (
                <th
                  key={String(c.key)}
                  style={{
                    minWidth: c.minWidth,
                    width: c.width,
                  }}
                  className={`px-3.5 py-2.5 font-medium ${alignClass(c.align)} ${
                    c.sortable ? 'cursor-pointer select-none hover:text-gray-900 dark:hover:text-white transition-colors' : ''
                  }`}
                  onClick={() =>
                    c.sortable &&
                    setSort((s) =>
                      s?.key === c.key
                        ? { key: String(c.key), dir: s.dir === 'asc' ? 'desc' : 'asc' }
                        : { key: String(c.key), dir: 'asc' }
                    )
                  }
                >
                  <div className="inline-flex items-center gap-1.5">
                    <span>{c.header}</span>
                    {sort?.key === c.key && (
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                        {sort.dir === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body (Scrollable rows) */}
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-400 dark:text-slate-500 text-xs">
                  {resolvedEmpty}
                </td>
              </tr>
            ) : (
              paginated.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="hover:bg-emerald-50/30 dark:hover:bg-slate-800/60 transition-colors duration-100"
                >
                  {columns.map((c) => (
                    <td
                      key={String(c.key)}
                      style={{
                        minWidth: c.minWidth,
                        width: c.width,
                      }}
                      className={`px-3.5 py-2.5 text-gray-700 dark:text-slate-300 ${alignClass(c.align)}`}
                    >
                      {c.render ? c.render(row) : String((row as Record<string, unknown>)[String(c.key)] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Fixed Pagination Footer (Pinned at bottom, outside scrollable area) */}
      {sorted.length > 0 && (
        <div className="shrink-0 pt-2.5">
          <Pagination
            currentPage={page}
            totalItems={sorted.length}
            pageSize={currentPageSize}
            onPageChange={setPage}
            onPageSizeChange={setCurrentPageSize}
          />
        </div>
      )}
    </div>
  )
}

export default DataTable