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
}

/**
 * Sleek, generic DataTable with 5px radius, compact padding, live search, sorting, and pagination.
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
    <div className="flex flex-col gap-2">
      {/* Optional Toolbar with Search and Custom Action */}
      {(searchable || action) && (
        <div className="flex items-center justify-between gap-3">
          {searchable ? (
            <div className="relative w-64">
              <Search className="absolute start-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder={resolvedPlaceholder}
                className="w-full h-7.5 ps-8 pe-2.5 text-xs rounded-[5px] border border-gray-200 bg-white placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
          ) : (
            <div />
          )}
          {action && <div>{action}</div>}
        </div>
      )}

      {/* Main Table Wrapper: 5px radius */}
      <div className="overflow-hidden rounded-[5px] border border-gray-200/90 bg-white">
        <table className="w-full border-collapse text-xs">
          {/* Table Header */}
          <thead className="bg-gray-50/80 text-[11px] font-medium text-gray-500 border-b border-gray-200">
            <tr>
              {columns.map((c) => (
                <th
                  key={String(c.key)}
                  className={`px-3 py-2 font-medium ${alignClass(c.align)} ${
                    c.sortable ? 'cursor-pointer select-none hover:text-gray-800' : ''
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
                  <div className="inline-flex items-center gap-1">
                    <span>{c.header}</span>
                    {sort?.key === c.key && (
                      <span className="text-[10px] text-gray-700">{sort.dir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-100">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400 text-xs">
                  {resolvedEmpty}
                </td>
              </tr>
            ) : (
              paginated.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="hover:bg-gray-50/60 transition-colors duration-100"
                >
                  {columns.map((c) => (
                    <td key={String(c.key)} className={`px-3 py-2 text-gray-700 ${alignClass(c.align)}`}>
                      {c.render ? c.render(row) : String((row as Record<string, unknown>)[String(c.key)] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {sorted.length > 0 && (
        <Pagination
          currentPage={page}
          totalItems={sorted.length}
          pageSize={currentPageSize}
          onPageChange={setPage}
          onPageSizeChange={setCurrentPageSize}
        />
      )}
    </div>
  )
}

export default DataTable