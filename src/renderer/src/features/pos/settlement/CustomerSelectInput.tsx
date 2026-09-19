import { useState, useRef, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { User, Search, X, Plus, Phone, FileText } from 'lucide-react'
import type { Customer } from '../../../core/types'
import { formatCurrency } from '../../../core/utils/formatters'

interface CustomerSelectInputProps {
  customers: Customer[]
  selectedCustomerId: number | null
  onSelectCustomer: (id: number | null) => void
  onOpenAddCustomer?: () => void
  onOpenCustomerLedger?: (customer: Customer) => void
}

/**
 * CustomerSelectInput: Fast searchable customer selector by name or phone with debt indicators.
 */
export function CustomerSelectInput({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  onOpenAddCustomer,
  onOpenCustomerLedger,
}: CustomerSelectInputProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  )

  // Filter customers by query (name or phone)
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return customers.slice(0, 10)
    return customers
      .filter((c) => {
        const nameMatch = c.name.toLowerCase().includes(q)
        const phoneMatch = c.phone ? c.phone.toLowerCase().includes(q) : false
        return nameMatch || phoneMatch
      })
      .slice(0, 10)
  }, [customers, searchQuery])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      {selectedCustomer ? (
        // Selected customer card badge
        <div className="h-7.5 px-2 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-800/80 rounded-[5px] flex items-center justify-between gap-1 text-xs w-full min-w-0 overflow-hidden">
          <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
            <User className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold text-emerald-950 dark:text-emerald-200 truncate text-[11px] min-w-0">
              {selectedCustomer.name}
            </span>
            {(selectedCustomer.balance || 0) > 0 && (
              <span
                className="text-[9px] font-mono px-1 py-0.2 rounded font-semibold shrink-0 bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/80 truncate max-w-[80px]"
                title={`${t('customers.balance')}: ${formatCurrency(selectedCustomer.balance)}`}
              >
                {formatCurrency(selectedCustomer.balance)}
              </span>
            )}
            {(selectedCustomer.balance || 0) < 0 && (
              <span
                className="text-[9px] font-mono px-1 py-0.2 rounded font-semibold shrink-0 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80 truncate max-w-[80px]"
                title={`${t('customers.creditCustomer')}: +${formatCurrency(Math.abs(selectedCustomer.balance))}`}
              >
                +{formatCurrency(Math.abs(selectedCustomer.balance))}
              </span>
            )}
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            {onOpenCustomerLedger && (
              <button
                type="button"
                onClick={() => onOpenCustomerLedger(selectedCustomer)}
                title="View Customer Statement & Purchasing History"
                className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 p-1 rounded hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onSelectCustomer(null)
                setSearchQuery('')
              }}
              title="Remove customer / switch to walk-in"
              className="text-gray-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        // Search Input Bar
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={t('customers.searchPlaceholder')}
            className="w-full h-7.5 ps-7 pe-14 text-xs border border-gray-300 dark:border-slate-700 rounded-[5px] bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 font-medium focus:outline-none focus:border-emerald-500"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 absolute start-2 pointer-events-none" />

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute end-7 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {onOpenAddCustomer && (
            <button
              type="button"
              onClick={onOpenAddCustomer}
              title="Add New Customer"
              className="absolute end-1 text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && !selectedCustomer && (
        <div className="absolute z-50 start-0 end-0 mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-[5px] shadow-lg max-h-56 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-100">
          {/* Walk-in default item */}
          <div
            onClick={() => {
              onSelectCustomer(null)
              setIsOpen(false)
            }}
            className="p-2 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs transition-colors"
          >
            <span className="text-gray-600 dark:text-slate-300 italic">{t('sold.walkIn')}</span>
            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">Walk-in</span>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="p-3 text-center text-xs text-gray-400 dark:text-slate-500 flex flex-col gap-1 items-center">
              <span>No customer found matching "{searchQuery}"</span>
              {onOpenAddCustomer && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false)
                    onOpenAddCustomer()
                  }}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline text-[11px] font-semibold mt-1 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> {t('customers.addCustomer')}
                </button>
              )}
            </div>
          ) : (
            filteredCustomers.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  onSelectCustomer(c.id)
                  setIsOpen(false)
                  setSearchQuery('')
                }}
                className="p-2 hover:bg-emerald-50/50 dark:hover:bg-slate-800/70 cursor-pointer flex items-center justify-between text-xs transition-colors"
              >
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-gray-800 dark:text-slate-100 truncate">{c.name}</span>
                  {c.phone && (
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono flex items-center gap-1">
                      <Phone className="w-2.5 h-2.5" /> {c.phone}
                    </span>
                  )}
                </div>

                <div className="text-end shrink-0 ms-2">
                  {(c.balance || 0) > 0 ? (
                    <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 px-1.5 py-0.5 rounded">
                      {formatCurrency(c.balance)}
                    </span>
                  ) : (c.balance || 0) < 0 ? (
                    <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 px-1.5 py-0.5 rounded">
                      +{formatCurrency(Math.abs(c.balance))}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-gray-400 dark:text-slate-500">
                      0 AFN
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
