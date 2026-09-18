import { useTranslation } from 'react-i18next'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'

export interface PaginationProps {
  currentPage: number
  totalItems: number
  pageSize?: number
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  showPageSizeSelector?: boolean
  showInfo?: boolean
  className?: string
}

/**
 * Sleek, modern pagination component with page numbers, smart ellipsis,
 * first/last shortcuts, and page size selector. Default limit: 10 records.
 */
export function Pagination({
  currentPage,
  totalItems,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = true,
  showInfo = true,
  className = '',
}: PaginationProps) {
  const { t } = useTranslation()

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)

  const fromIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1
  const toIndex = Math.min(safeCurrentPage * pageSize, totalItems)

  // Generate page numbers with smart ellipsis
  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages]
    }

    if (safeCurrentPage >= totalPages - 3) {
      return [
        1,
        '...',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ]
    }

    return [
      1,
      '...',
      safeCurrentPage - 1,
      safeCurrentPage,
      safeCurrentPage + 1,
      '...',
      totalPages,
    ]
  }

  const pageNumbers = getPageNumbers()

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 px-2 py-2 text-xs text-gray-600 select-none ${className}`}
    >
      {/* Left: Records summary & optional page size */}
      <div className="flex items-center gap-3">
        {showInfo && (
          <span className="font-normal text-gray-500">
            {t('table.showingToOf', {
              from: fromIndex,
              to: toIndex,
              total: totalItems,
            })}
          </span>
        )}

        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-gray-500">
            <span className="hidden sm:inline text-[11px]">{t('table.perPage', 'per page')}:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value)
                onPageSizeChange(newSize)
                onPageChange(1)
              }}
              className="h-7 px-2 py-0.5 text-xs font-medium bg-white border border-gray-200 rounded-[5px] text-gray-700 hover:border-gray-300 focus:outline-none focus:border-[#4A7C6F] focus:ring-1 focus:ring-[#4A7C6F]/20 cursor-pointer transition-colors"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Navigation buttons & page numbers */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage === 1}
          title="First Page"
          className="flex h-7 w-7 items-center justify-center rounded-[5px] border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:scale-[0.96] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-600 transition-all cursor-pointer"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1}
          title="Previous Page"
          className="flex h-7 w-7 items-center justify-center rounded-[5px] border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:scale-[0.96] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-600 transition-all cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 px-0.5">
          {pageNumbers.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="flex h-7 w-6 items-center justify-center text-gray-400 font-medium select-none text-[11px]"
                >
                  •••
                </span>
              )
            }

            const isCurrent = p === safeCurrentPage
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange(p)}
                className={`flex h-7 min-w-[28px] px-1.5 items-center justify-center rounded-[5px] text-xs font-medium transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#4A7C6F] text-white font-semibold shadow-xs border border-[#4A7C6F]'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                {p}
              </button>
            )
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage === totalPages}
          title="Next Page"
          className="flex h-7 w-7 items-center justify-center rounded-[5px] border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:scale-[0.96] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-600 transition-all cursor-pointer"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={safeCurrentPage === totalPages}
          title="Last Page"
          className="flex h-7 w-7 items-center justify-center rounded-[5px] border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:scale-[0.96] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-600 transition-all cursor-pointer"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
