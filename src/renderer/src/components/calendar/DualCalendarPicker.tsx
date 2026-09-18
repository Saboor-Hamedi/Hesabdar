import { useState, useRef, useEffect, useMemo } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw,
} from 'lucide-react'
import {
  gregorianToShamsi,
  shamsiToGregorian,
  getShamsiDaysInMonth,
  SHAMSI_MONTHS,
  GREGORIAN_MONTHS,
  GREGORIAN_MONTHS_SHORT,
  formatDualDate,
} from '../../core/calendar/jalali'
import {
  useCalendarFilter,
  type DatePreset,
} from '../../core/calendar/calendarContext'

interface CompactDropdownProps<T> {
  value: T
  options: { value: T; label: string; subLabel?: string }[]
  onChange: (val: T) => void
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  theme?: 'emerald' | 'gray'
  menuWidth?: string
  title?: string
}

function CompactDropdown<T extends string | number>({
  value,
  options,
  onChange,
  isOpen,
  onToggle,
  onClose,
  theme = 'emerald',
  menuWidth = 'w-36',
  title,
}: CompactDropdownProps<T>) {
  const ref = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((o) => o.value === value)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClick)
    }
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.querySelector('[data-active="true"]') as HTMLElement
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [isOpen])

  const buttonStyles =
    theme === 'emerald'
      ? 'bg-white hover:bg-emerald-50 text-emerald-950 border-emerald-300 hover:border-emerald-400'
      : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300 hover:border-gray-400'

  const activeOptionStyles =
    theme === 'emerald'
      ? 'bg-emerald-600 text-white font-bold'
      : 'bg-gray-900 text-white font-bold'

  return (
    <div
      ref={ref}
      className="relative inline-block text-left"
      onDoubleClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        title={title}
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className={`h-7 px-2.5 inline-flex items-center justify-between gap-1.5 text-xs font-bold rounded-md border shadow-2xs transition-all cursor-pointer select-none ${buttonStyles}`}
      >
        <span>{selectedOption?.label || String(value)}</span>
        <ChevronDown
          className={`w-3 h-3 opacity-60 transition-transform duration-150 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          ref={listRef}
          className={`absolute left-0 top-full mt-1 z-50 ${menuWidth} max-h-48 overflow-y-auto bg-white rounded-lg shadow-2xl border border-gray-200/90 py-1 text-xs select-none`}
        >
          {options.map((opt) => {
            const isSel = opt.value === value
            return (
              <button
                key={String(opt.value)}
                type="button"
                data-active={isSel ? 'true' : 'false'}
                onClick={() => {
                  onChange(opt.value)
                  onClose()
                }}
                className={`w-full px-3 py-1.5 text-left flex items-center justify-between transition-colors cursor-pointer text-xs ${
                  isSel ? activeOptionStyles : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <span className="font-medium">{opt.label}</span>
                {opt.subLabel && (
                  <span
                    className={`text-[10px] ml-1.5 font-mono ${
                      isSel ? 'text-white/80' : 'text-gray-400'
                    }`}
                  >
                    {opt.subLabel}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export interface DualCalendarPickerProps {
  isOpen?: boolean
  onToggle?: () => void
  onClose?: () => void
}

export function DualCalendarPicker({
  isOpen: controlledIsOpen,
  onToggle: controlledOnToggle,
  onClose: controlledOnClose,
}: DualCalendarPickerProps = {}) {
  const {
    startDate,
    endDate,
    activePreset,
    preferredView,
    setDateRange,
    setPreset,
    setPreferredView,
  } = useCalendarFilter()

  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const isControlled = controlledIsOpen !== undefined
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen
  const containerRef = useRef<HTMLDivElement>(null)

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

  const handleToggle = () => {
    if (isControlled) {
      controlledOnToggle?.()
    } else {
      setInternalIsOpen(!internalIsOpen)
    }
  }

  const handleClose = () => {
    setOpenDropdownId(null)
    setPickingStart(null)
    if (isControlled) {
      controlledOnClose?.()
    } else {
      setInternalIsOpen(false)
    }
  }

  const initialShamsi = useMemo(() => gregorianToShamsi(startDate), [startDate])
  const [shamsiMonth, setShamsiMonth] = useState<number>(() => initialShamsi.jm)
  const [shamsiYear, setShamsiYear] = useState<number>(() => initialShamsi.jy)
  const [gregMonth, setGregMonth] = useState<number>(() => startDate.getMonth())
  const [gregYear, setGregYear] = useState<number>(() => startDate.getFullYear())

  // Range selection in-progress state
  const [pickingStart, setPickingStart] = useState<Date | null>(null)
  const [hoverDate, setHoverDate] = useState<Date | null>(null)

  // Year lists for jump selectors (Shamsi 1350-1460, Gregorian 1970-2060)
  const shamsiYears = useMemo(() => {
    const list: number[] = []
    for (let y = 1350; y <= 1460; y++) list.push(y)
    return list
  }, [])

  const gregorianYears = useMemo(() => {
    const list: number[] = []
    for (let y = 1970; y <= 2060; y++) list.push(y)
    return list
  }, [])

  // Options for custom sleek dropdowns
  const shamsiMonthOptions = useMemo(() => {
    return SHAMSI_MONTHS.map((m) => ({
      value: m.index,
      label: m.name_fa,
      subLabel: m.name_en,
    }))
  }, [])

  const shamsiYearOptions = useMemo(() => {
    return shamsiYears.map((y) => ({
      value: y,
      label: String(y),
    }))
  }, [shamsiYears])

  const gregMonthOptions = useMemo(() => {
    return GREGORIAN_MONTHS.map((name, idx) => ({
      value: idx,
      label: name.substring(0, 3),
      subLabel: name,
    }))
  }, [])

  const gregYearOptions = useMemo(() => {
    return gregorianYears.map((y) => ({
      value: y,
      label: String(y),
    }))
  }, [gregorianYears])

  // Sync current calendar view when selected date range changes
  useEffect(() => {
    const s = gregorianToShamsi(startDate)
    setShamsiMonth(s.jm)
    setShamsiYear(s.jy)
    setGregMonth(startDate.getMonth())
    setGregYear(startDate.getFullYear())
  }, [startDate, endDate])

  // Escape key handler: closes active select dropdown first, then modal
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        if (openDropdownId !== null) {
          setOpenDropdownId(null)
        } else {
          handleClose()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, openDropdownId])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Header pill text (e.g. "18 Sep 2026 | 28 Sunbula 1405")
  const dualDateLabel = useMemo(() => {
    return formatDualDate(new Date())
  }, [])

  // Selected range summary for clean, elegant footer display
  const rangeSummary = useMemo(() => {
    const s = gregorianToShamsi(startDate)
    const e = gregorianToShamsi(endDate)
    const diffDays =
      Math.round(Math.abs((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))) + 1

    const shamsiStartStr = `${s.jy}/${String(s.jm).padStart(2, '0')}/${String(s.jd).padStart(2, '0')}`
    const shamsiEndStr = `${e.jy}/${String(e.jm).padStart(2, '0')}/${String(e.jd).padStart(2, '0')}`

    const gregStartStr = `${GREGORIAN_MONTHS_SHORT[startDate.getMonth()]} ${startDate.getDate()}, ${startDate.getFullYear()}`
    const gregEndStr = `${GREGORIAN_MONTHS_SHORT[endDate.getMonth()]} ${endDate.getDate()}, ${endDate.getFullYear()}`

    const isSingleDay = startDate.toDateString() === endDate.toDateString()

    return {
      shamsiText: isSingleDay ? shamsiStartStr : `${shamsiStartStr} → ${shamsiEndStr}`,
      gregText: isSingleDay ? gregStartStr : `${gregStartStr} → ${gregEndStr}`,
      durationLabel: isSingleDay ? '1 Day' : `${diffDays} Days`,
      isSingleDay,
    }
  }, [startDate, endDate])

  // Handle clicking a date on either calendar
  const handleDateClick = (clickedDate: Date) => {
    if (!pickingStart) {
      setPickingStart(clickedDate)
    } else {
      const start = clickedDate < pickingStart ? clickedDate : pickingStart
      const end = clickedDate < pickingStart ? pickingStart : clickedDate
      setDateRange(start, end, 'custom')
      setPickingStart(null)
    }
  }

  // Check if a date is within selected or hover range
  const isSelected = (d: Date) => {
    const time = d.getTime()
    const st = startDate.getTime()
    const et = endDate.getTime()

    if (pickingStart && hoverDate) {
      const min = Math.min(pickingStart.getTime(), hoverDate.getTime())
      const max = Math.max(pickingStart.getTime(), hoverDate.getTime())
      return time >= min && time <= max
    }

    return time >= st && time <= et
  }

  const isRangeEndpoint = (d: Date) => {
    const dStr = d.toDateString()
    return dStr === startDate.toDateString() || dStr === endDate.toDateString()
  }

  const isToday = (d: Date) => {
    return d.toDateString() === new Date().toDateString()
  }

  // ── Safe Bounded Navigation State (Guarantees NO NaN anywhere) ──────────
  const safeShamsiMonth = isNaN(shamsiMonth) || shamsiMonth < 1 || shamsiMonth > 12 ? 6 : shamsiMonth
  const safeShamsiYear = isNaN(shamsiYear) || shamsiYear < 1300 ? 1405 : shamsiYear
  const safeGregMonth = isNaN(gregMonth) || gregMonth < 0 || gregMonth > 11 ? 8 : gregMonth
  const safeGregYear = isNaN(gregYear) || gregYear < 1900 ? 2026 : gregYear

  // ── Synchronized Jump Handlers ──────────────────────────────────────────
  const handleShamsiMonthJump = (m: number) => {
    if (isNaN(m)) return
    setShamsiMonth(m)
    const gDate = shamsiToGregorian(safeShamsiYear, m, 1)
    if (!isNaN(gDate.getTime())) {
      setGregYear(gDate.getFullYear())
      setGregMonth(gDate.getMonth())
    }
  }

  const handleShamsiYearJump = (y: number) => {
    if (isNaN(y)) return
    setShamsiYear(y)
    const gDate = shamsiToGregorian(y, safeShamsiMonth, 1)
    if (!isNaN(gDate.getTime())) {
      setGregYear(gDate.getFullYear())
      setGregMonth(gDate.getMonth())
    }
  }

  const handleGregMonthJump = (m: number) => {
    if (isNaN(m)) return
    setGregMonth(m)
    const s = gregorianToShamsi(new Date(safeGregYear, m, 1, 12, 0, 0))
    if (!isNaN(s.jy) && !isNaN(s.jm)) {
      setShamsiYear(s.jy)
      setShamsiMonth(s.jm)
    }
  }

  const handleGregYearJump = (y: number) => {
    if (isNaN(y)) return
    setGregYear(y)
    const s = gregorianToShamsi(new Date(y, safeGregMonth, 1, 12, 0, 0))
    if (!isNaN(s.jy) && !isNaN(s.jm)) {
      setShamsiYear(s.jy)
      setShamsiMonth(s.jm)
    }
  }

  // ── Gregorian Calendar Navigation & Cells ────────────────────────────────
  const nextGregMonth = () => {
    let nextM = safeGregMonth + 1
    let nextY = safeGregYear
    if (nextM > 11) {
      nextM = 0
      nextY += 1
    }
    setGregMonth(nextM)
    setGregYear(nextY)
    const s = gregorianToShamsi(new Date(nextY, nextM, 1, 12, 0, 0))
    if (!isNaN(s.jy) && !isNaN(s.jm)) {
      setShamsiYear(s.jy)
      setShamsiMonth(s.jm)
    }
  }

  const prevGregMonth = () => {
    let prevM = safeGregMonth - 1
    let prevY = safeGregYear
    if (prevM < 0) {
      prevM = 11
      prevY -= 1
    }
    setGregMonth(prevM)
    setGregYear(prevY)
    const s = gregorianToShamsi(new Date(prevY, prevM, 1, 12, 0, 0))
    if (!isNaN(s.jy) && !isNaN(s.jm)) {
      setShamsiYear(s.jy)
      setShamsiMonth(s.jm)
    }
  }

  const gregDaysInMonth = new Date(safeGregYear, safeGregMonth + 1, 0).getDate()
  const gregFirstDayWeekday = new Date(safeGregYear, safeGregMonth, 1).getDay() // 0 = Sun

  // ── Shamsi Calendar Navigation & Cells ────────────────────────────────────
  const nextShamsiMonth = () => {
    let nextM = safeShamsiMonth + 1
    let nextY = safeShamsiYear
    if (nextM > 12) {
      nextM = 1
      nextY += 1
    }
    setShamsiMonth(nextM)
    setShamsiYear(nextY)
    const gDate = shamsiToGregorian(nextY, nextM, 1)
    if (!isNaN(gDate.getTime())) {
      setGregYear(gDate.getFullYear())
      setGregMonth(gDate.getMonth())
    }
  }

  const prevShamsiMonth = () => {
    let prevM = safeShamsiMonth - 1
    let prevY = safeShamsiYear
    if (prevM < 1) {
      prevM = 12
      prevY -= 1
    }
    setShamsiMonth(prevM)
    setShamsiYear(prevY)
    const gDate = shamsiToGregorian(prevY, prevM, 1)
    if (!isNaN(gDate.getTime())) {
      setGregYear(gDate.getFullYear())
      setGregMonth(gDate.getMonth())
    }
  }

  const shamsiDaysInMonth = getShamsiDaysInMonth(safeShamsiYear, safeShamsiMonth)
  const shamsiFirstDayDate = shamsiToGregorian(safeShamsiYear, safeShamsiMonth, 1)
  const shamsiFirstDayWeekday = (shamsiFirstDayDate.getDay() + 1) % 7 // 0 = Sat, 6 = Fri

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      onDoubleClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* ── 1. Compact Pill-Shaped Titlebar Trigger ──────────────────────── */}
      <button
        type="button"
        onClick={handleToggle}
        onDoubleClick={(e) => e.stopPropagation()}
        className={`
          flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-medium transition-all
          border cursor-pointer select-none
          ${
            isOpen
              ? 'bg-[#EAF3EF] text-[#2F6153] border-[#7CAE9F] shadow-xs ring-1 ring-[#7CAE9F]/40'
              : 'bg-white/80 hover:bg-white text-gray-700 hover:text-gray-900 border-gray-200/90 shadow-2xs'
          }
        `}
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        title="Dual Calendar (Gregorian & Shamsi)"
      >
        <CalendarIcon className="w-3.5 h-3.5 text-[#4A7C6F] shrink-0" />
        <span className="truncate tracking-tight font-medium text-gray-800">
          {dualDateLabel}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-gray-400 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-[#2F6153]' : ''
          }`}
        />
      </button>

      {/* ── 2. Floating Popover Dropdown (Comfortable & Sleek) ─────────────── */}
      {isOpen && (
        <div
          onDoubleClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-full right-0 mt-2 z-[9999] bg-white rounded-xl shadow-2xl border border-gray-200/90 text-gray-800 text-xs overflow-hidden select-none animate-in fade-in zoom-in-95 duration-100"
          style={
            {
              width: preferredView === 'dual' ? '640px' : '360px',
              maxWidth: '94vw',
              WebkitAppRegion: 'no-drag',
            } as React.CSSProperties
          }
        >
          {/* Top Bar: Quick Selectors & View Switcher */}
          <div className="px-3.5 py-2 bg-gray-50/90 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
            {/* Quick Action Preset Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(
                [
                  { id: 'today', label: 'Today' },
                  { id: 'yesterday', label: 'Yesterday' },
                  { id: 'this_week', label: 'Week' },
                  { id: 'this_month_shamsi', label: 'Month (Shamsi)' },
                  { id: 'this_month_gregorian', label: 'Month (Greg)' },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setPreset(preset.id as DatePreset)}
                  className={`
                    px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer
                    ${
                      activePreset === preset.id
                        ? 'bg-[#4A7C6F] text-white shadow-2xs'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/70'
                    }
                  `}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* View Mode Switcher Tabs */}
            <div className="flex items-center bg-gray-200/70 p-0.5 rounded-lg text-[11px]">
              <button
                type="button"
                onClick={() => setPreferredView('shamsi')}
                className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                  preferredView === 'shamsi'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                شمسـی
              </button>
              <button
                type="button"
                onClick={() => setPreferredView('dual')}
                className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                  preferredView === 'dual'
                    ? 'bg-white text-[#2F6153] shadow-2xs font-semibold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Dual
              </button>
              <button
                type="button"
                onClick={() => setPreferredView('gregorian')}
                className={`px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                  preferredView === 'gregorian'
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Gregorian
              </button>
            </div>
          </div>

          {/* Calendars Grid Area (Comfortable Spacious Layout) */}
          <div
            className={`p-3.5 grid gap-4 ${
              preferredView === 'dual' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {/* View B: Shamsi / Afghan Solar Hijri Calendar */}
            {(preferredView === 'dual' || preferredView === 'shamsi') && (
              <div className="flex flex-col bg-emerald-50/30 rounded-xl p-3 border border-emerald-200/60">
                {/* Header: Month & Year Navigator with Sleek Custom Dropdowns */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />

                    {/* Sleek Shamsi Month Dropdown */}
                    <CompactDropdown
                      value={safeShamsiMonth}
                      options={shamsiMonthOptions}
                      onChange={handleShamsiMonthJump}
                      isOpen={openDropdownId === 'shamsi_month'}
                      onToggle={() =>
                        setOpenDropdownId(openDropdownId === 'shamsi_month' ? null : 'shamsi_month')
                      }
                      onClose={() => setOpenDropdownId(null)}
                      theme="emerald"
                      menuWidth="w-36"
                      title="Select Shamsi Month"
                    />

                    {/* Sleek Shamsi Year Dropdown (1350 to 1460) */}
                    <CompactDropdown
                      value={safeShamsiYear}
                      options={shamsiYearOptions}
                      onChange={handleShamsiYearJump}
                      isOpen={openDropdownId === 'shamsi_year'}
                      onToggle={() =>
                        setOpenDropdownId(openDropdownId === 'shamsi_year' ? null : 'shamsi_year')
                      }
                      onClose={() => setOpenDropdownId(null)}
                      theme="emerald"
                      menuWidth="w-24"
                      title="Select Shamsi Year"
                    />
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={prevShamsiMonth}
                      onDoubleClick={(e) => e.stopPropagation()}
                      className="p-1 rounded-md hover:bg-emerald-100 text-emerald-800 transition-colors cursor-pointer"
                      title="Previous Month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={nextShamsiMonth}
                      onDoubleClick={(e) => e.stopPropagation()}
                      className="p-1 rounded-md hover:bg-emerald-100 text-emerald-800 transition-colors cursor-pointer"
                      title="Next Month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Weekdays Header (Sat to Fri) */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-emerald-800/70 mb-1">
                  <span>ش</span>
                  <span>ی</span>
                  <span>د</span>
                  <span>س</span>
                  <span>چ</span>
                  <span>پ</span>
                  <span className="text-rose-600 font-bold">ج</span>
                </div>

                {/* Day Cells (Standard Comfortable 28px) */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells before month start */}
                  {Array.from({ length: shamsiFirstDayWeekday }).map((_, i) => (
                    <div key={`empty-s-${i}`} className="h-7 w-7" />
                  ))}

                  {/* Shamsi Days */}
                  {Array.from({ length: shamsiDaysInMonth }).map((_, i) => {
                    const dayNum = i + 1
                    const cellDate = shamsiToGregorian(safeShamsiYear, safeShamsiMonth, dayNum)
                    const selected = isSelected(cellDate)
                    const endpoint = isRangeEndpoint(cellDate)
                    const today = isToday(cellDate)
                    const isFriday = (shamsiFirstDayWeekday + i) % 7 === 6

                    return (
                      <button
                        key={`s-day-${dayNum}`}
                        type="button"
                        onClick={() => handleDateClick(cellDate)}
                        onMouseEnter={() => pickingStart && setHoverDate(cellDate)}
                        className={`
                          h-7 w-7 rounded-md text-xs flex items-center justify-center font-medium transition-colors relative cursor-pointer
                          ${
                            endpoint
                              ? 'bg-emerald-700 text-white font-bold shadow-xs z-10'
                              : selected
                              ? 'bg-emerald-200/80 text-emerald-900'
                              : today
                              ? 'border-2 border-emerald-600 text-emerald-950 font-bold bg-white'
                              : 'hover:bg-emerald-100/70 text-gray-800'
                          }
                          ${isFriday && !selected ? 'text-rose-600' : ''}
                        `}
                      >
                        {dayNum}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* View A: Gregorian Calendar */}
            {(preferredView === 'dual' || preferredView === 'gregorian') && (
              <div className="flex flex-col bg-gray-50/60 rounded-xl p-3 border border-gray-200/80">
                {/* Header: Month & Year Navigator with Sleek Custom Dropdowns */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gray-400 shrink-0" />

                    {/* Sleek Gregorian Month Dropdown */}
                    <CompactDropdown
                      value={safeGregMonth}
                      options={gregMonthOptions}
                      onChange={handleGregMonthJump}
                      isOpen={openDropdownId === 'greg_month'}
                      onToggle={() =>
                        setOpenDropdownId(openDropdownId === 'greg_month' ? null : 'greg_month')
                      }
                      onClose={() => setOpenDropdownId(null)}
                      theme="gray"
                      menuWidth="w-32"
                      title="Select Gregorian Month"
                    />

                    {/* Sleek Gregorian Year Dropdown (1970 to 2060) */}
                    <CompactDropdown
                      value={safeGregYear}
                      options={gregYearOptions}
                      onChange={handleGregYearJump}
                      isOpen={openDropdownId === 'greg_year'}
                      onToggle={() =>
                        setOpenDropdownId(openDropdownId === 'greg_year' ? null : 'greg_year')
                      }
                      onClose={() => setOpenDropdownId(null)}
                      theme="gray"
                      menuWidth="w-24"
                      title="Select Gregorian Year"
                    />
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={prevGregMonth}
                      onDoubleClick={(e) => e.stopPropagation()}
                      className="p-1 rounded-md hover:bg-gray-200/70 text-gray-600 transition-colors cursor-pointer"
                      title="Previous Month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={nextGregMonth}
                      onDoubleClick={(e) => e.stopPropagation()}
                      className="p-1 rounded-md hover:bg-gray-200/70 text-gray-600 transition-colors cursor-pointer"
                      title="Next Month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Weekdays Header (Sun to Sat) */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-gray-400 mb-1">
                  <span>Su</span>
                  <span>Mo</span>
                  <span>Tu</span>
                  <span>We</span>
                  <span>Th</span>
                  <span>Fr</span>
                  <span>Sa</span>
                </div>

                {/* Day Cells (Standard Comfortable 28px) */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells before month start */}
                  {Array.from({ length: gregFirstDayWeekday }).map((_, i) => (
                    <div key={`empty-g-${i}`} className="h-7 w-7" />
                  ))}

                  {/* Gregorian Days */}
                  {Array.from({ length: gregDaysInMonth }).map((_, i) => {
                    const dayNum = i + 1
                    const cellDate = new Date(safeGregYear, safeGregMonth, dayNum, 12, 0, 0)
                    const selected = isSelected(cellDate)
                    const endpoint = isRangeEndpoint(cellDate)
                    const today = isToday(cellDate)

                    return (
                      <button
                        key={`g-day-${dayNum}`}
                        type="button"
                        onClick={() => handleDateClick(cellDate)}
                        onMouseEnter={() => pickingStart && setHoverDate(cellDate)}
                        className={`
                          h-7 w-7 rounded-md text-xs flex items-center justify-center font-medium transition-colors cursor-pointer
                          ${
                            endpoint
                              ? 'bg-gray-900 text-white font-bold shadow-xs z-10'
                              : selected
                              ? 'bg-gray-200 text-gray-900 font-semibold'
                              : today
                              ? 'border-2 border-[#4A7C6F] text-[#4A7C6F] font-bold bg-white'
                              : 'hover:bg-gray-100 text-gray-800'
                          }
                        `}
                      >
                        {dayNum}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Bar: Manual Typing Inputs & Action Controls (Spacious & Clean Layout) */}
          <div className="px-3.5 py-2.5 bg-gray-50 border-t border-gray-100 flex flex-col gap-2 text-xs">
            {/* Range Summary & Picking Status Card */}
            {pickingStart ? (
              <div className="flex items-center justify-between gap-2 bg-emerald-50/90 px-3 py-2 rounded-lg border border-emerald-300/80 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                  </span>
                  <span className="text-[11px] font-medium text-emerald-950">
                    Click an end date to finish the range...
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPickingStart(null)}
                  className="text-[10px] text-emerald-800 hover:text-emerald-950 underline font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200/90 shadow-2xs">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none">
                      Range:
                    </span>
                    <span className="font-mono text-xs font-bold text-gray-900 tracking-tight">
                      {rangeSummary.shamsiText}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/70 select-none">
                      {rangeSummary.durationLabel}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium truncate mt-0.5">
                    {rangeSummary.gregText}
                  </span>
                </div>
              </div>
            )}

            {/* Row 2: Reset Today & Done Buttons */}
            <div className="flex items-center justify-between pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setPreset('today')
                  setPickingStart(null)
                }}
                className="h-6 flex items-center gap-1.5 text-[11px] font-medium text-gray-600 hover:text-gray-900 px-2 py-0.5 rounded-md hover:bg-gray-200/60 transition-colors cursor-pointer"
                title="Reset to Today"
              >
                <RotateCcw className="w-3 h-3 text-gray-500" />
                Reset Today
              </button>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 select-none">Press Esc to close</span>
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-6 px-3 bg-gray-900 hover:bg-black active:scale-95 text-white font-medium rounded-md text-[11px] transition-all cursor-pointer shadow-2xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DualCalendarPicker
