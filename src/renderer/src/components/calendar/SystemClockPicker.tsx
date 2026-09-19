import { useState, useRef, useEffect, useMemo } from 'react'
import {
  Clock,
  ChevronDown,
  Copy,
  Check,
  Calendar as CalendarIcon,
} from 'lucide-react'
import {
  gregorianToShamsi,
  SHAMSI_MONTHS,
  GREGORIAN_MONTHS,
} from '../../core/calendar/jalali'

const PERSIAN_WEEKDAYS = [
  'یک‌شنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
  'شنبه',
]

const ENGLISH_WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export interface SystemClockPickerProps {
  isOpen?: boolean
  onToggle?: () => void
  onClose?: () => void
}

export function SystemClockPicker({
  isOpen: controlledIsOpen,
  onToggle: controlledOnToggle,
  onClose: controlledOnClose,
}: SystemClockPickerProps = {}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const isControlled = controlledIsOpen !== undefined
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen
  const [is24Hour, setIs24Hour] = useState(false)
  const [copied, setCopied] = useState(false)
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const containerRef = useRef<HTMLDivElement>(null)

  const handleToggle = () => {
    if (isControlled) {
      controlledOnToggle?.()
    } else {
      setInternalIsOpen(!internalIsOpen)
    }
  }

  const handleClose = () => {
    if (isControlled) {
      controlledOnClose?.()
    } else {
      setInternalIsOpen(false)
    }
  }

  // Ultra-lightweight second-boundary ticking timer (0% CPU impact, no unnecessary loops)
  useEffect(() => {
    let intervalId: NodeJS.Timeout

    // Align timer with the start of the next second to prevent drifting and unnecessary frames
    const delay = 1000 - (Date.now() % 1000)
    const timeoutId = setTimeout(() => {
      setCurrentTime(new Date())
      intervalId = setInterval(() => {
        setCurrentTime(new Date())
      }, 1000)
    }, delay)

    return () => {
      clearTimeout(timeoutId)
      clearInterval(intervalId)
    }
  }, [])

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClick)
    }
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Compact time string for the TitleBar trigger button (only recalculates once per second)
  const triggerLabel = useMemo(() => {
    return currentTime.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: !is24Hour,
    })
  }, [currentTime, is24Hour])

  // Lazy date & clock hand calculations: ONLY evaluated when popover is actually open
  const clockDetails = useMemo(() => {
    if (!isOpen) return null

    const h = currentTime.getHours()
    const m = currentTime.getMinutes()
    const s = currentTime.getSeconds()

    const sAngle = s * 6
    const mAngle = (m + s / 60) * 6
    const hAngle = ((h % 12) + m / 60) * 30

    let displayH = h
    let ampm = ''
    if (!is24Hour) {
      ampm = h >= 12 ? 'PM' : 'AM'
      displayH = h % 12 || 12
    }

    const shamsiDate = gregorianToShamsi(currentTime)
    const shamsiMonthName = SHAMSI_MONTHS[shamsiDate.jm - 1]?.name_fa || ''
    const persianWeekday = PERSIAN_WEEKDAYS[currentTime.getDay()]
    const gregMonthName = GREGORIAN_MONTHS[currentTime.getMonth()]
    const englishWeekday = ENGLISH_WEEKDAYS[currentTime.getDay()]

    return {
      hourAngle: hAngle,
      minuteAngle: mAngle,
      secondAngle: sAngle,
      hoursStr: is24Hour ? String(displayH).padStart(2, '0') : String(displayH),
      minutesStr: String(m).padStart(2, '0'),
      secondsStr: String(s).padStart(2, '0'),
      ampm,
      shamsiText: `${persianWeekday}، ${shamsiDate.jd} ${shamsiMonthName} ${shamsiDate.jy}`,
      gregText: `${englishWeekday}, ${currentTime.getDate()} ${gregMonthName} ${currentTime.getFullYear()}`,
      shamsiDate,
    }
  }, [currentTime, isOpen, is24Hour])

  // Local Timezone info
  const timeZoneInfo = useMemo(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local'
      const offsetMinutes = -currentTime.getTimezoneOffset()
      const sign = offsetMinutes >= 0 ? '+' : '-'
      const absMinutes = Math.abs(offsetMinutes)
      const offH = String(Math.floor(absMinutes / 60)).padStart(2, '0')
      const offM = String(absMinutes % 60).padStart(2, '0')
      return {
        name: tz.replace('_', ' '),
        offset: `UTC${sign}${offH}:${offM}`,
      }
    } catch {
      return { name: 'Local Time', offset: 'UTC' }
    }
  }, [currentTime])

  const handleCopyTimestamp = () => {
    if (!clockDetails) return
    const text = `${clockDetails.shamsiDate.jy}/${String(clockDetails.shamsiDate.jm).padStart(2, '0')}/${String(clockDetails.shamsiDate.jd).padStart(2, '0')} — ${triggerLabel} (${timeZoneInfo.offset})`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      onDoubleClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* ── 1. TitleBar Pill Trigger (Exact same height h-6 as calendar) ─── */}
      <button
        type="button"
        onClick={handleToggle}
        onDoubleClick={(e) => e.stopPropagation()}
        className={`
          flex items-center gap-1.5 h-6 px-2.5 rounded-[5px] text-[11px] font-medium transition-all
          border cursor-pointer select-none
          ${
            isOpen
              ? 'bg-[#EAF3EF] dark:bg-[#5A8F7B]/25 text-[#2F6153] dark:text-[#7EBCA8] border-[#7CAE9F] dark:border-[#5A8F7B]/50 shadow-xs ring-1 ring-[#7CAE9F]/40'
              : 'bg-white/80 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 hover:text-gray-900 dark:hover:text-white border-gray-200/90 dark:border-slate-700 shadow-2xs'
          }
        `}
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        title="Live System Clock & Time Details"
      >
        <div className="relative flex items-center justify-center">
          <Clock className="w-3.5 h-3.5 text-[#4A7C6F] dark:text-[#68A590] shrink-0" />
          <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
        </div>

        <span className="font-mono text-[11px] text-gray-800 dark:text-slate-200 font-semibold tracking-tight">
          {triggerLabel}
        </span>

        <ChevronDown
          className={`w-3 h-3 text-gray-400 dark:text-slate-400 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-[#2F6153] dark:text-[#7EBCA8]' : ''
          }`}
        />
      </button>

      {/* ── 2. Floating Popover Panel (Exact same header & styling as Calendar) ─── */}
      {isOpen && clockDetails && (
        <div
          onDoubleClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-full right-0 mt-2 z-[9999] w-[360px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200/90 dark:border-slate-800 text-gray-800 dark:text-slate-200 text-xs overflow-hidden select-none animate-in fade-in zoom-in-95 duration-100"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {/* Header: Clean, neutral style matching DualCalendarPicker */}
          <div className="px-3.5 py-2 bg-gray-50/90 dark:bg-slate-800/80 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
              <span className="text-[11px] font-semibold text-gray-800 dark:text-slate-200 tracking-tight">
                System Time & Clock
              </span>
              <span className="text-[10px] text-gray-400 dark:text-slate-400 font-mono ml-1">
                {timeZoneInfo.offset}
              </span>
            </div>

            {/* 12H / 24H View Mode Switcher Tabs (Same tab styling as DualCalendarPicker) */}
            <div className="flex items-center bg-gray-200/70 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
              <button
                type="button"
                onClick={() => setIs24Hour(false)}
                className={`px-2.5 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                  !is24Hour
                    ? 'bg-white dark:bg-slate-700 text-[#2F6153] dark:text-[#7EBCA8] shadow-2xs font-semibold'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
                }`}
              >
                12H
              </button>
              <button
                type="button"
                onClick={() => setIs24Hour(true)}
                className={`px-2.5 py-0.5 rounded-md font-medium transition-all cursor-pointer ${
                  is24Hour
                    ? 'bg-white dark:bg-slate-700 text-[#2F6153] dark:text-[#7EBCA8] shadow-2xs font-semibold'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
                }`}
              >
                24H
              </button>
            </div>
          </div>

          {/* Clock Visuals: Analog Dial + Digital Readout */}
          <div className="p-3.5 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 bg-gray-50/60 dark:bg-slate-800/40 p-3 rounded-xl border border-gray-200/70 dark:border-slate-700/60">
              {/* Precision SVG Analog Clock Dial */}
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full drop-shadow-xs" viewBox="0 0 100 100">
                  {/* Outer Rim */}
                  <circle
                    cx="50"
                    cy="50"
                    r="47"
                    className="fill-white dark:fill-slate-800 stroke-gray-200 dark:stroke-slate-700"
                    strokeWidth="2.5"
                  />
                  {/* Inner Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="43"
                    className="fill-none stroke-emerald-900/10 dark:stroke-emerald-400/20"
                    strokeWidth="0.5"
                  />

                  {/* 12 Hour Ticks */}
                  {Array.from({ length: 12 }).map((_, i) => {
                    const angle = (i * 30 * Math.PI) / 180
                    const isMajor = i % 3 === 0
                    const innerR = isMajor ? 36 : 40
                    const x1 = 50 + 44 * Math.sin(angle)
                    const y1 = 50 - 44 * Math.cos(angle)
                    const x2 = 50 + innerR * Math.sin(angle)
                    const y2 = 50 - innerR * Math.cos(angle)
                    return (
                      <line
                        key={`tick-${i}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={isMajor ? '#2F6153' : '#9ca3af'}
                        strokeWidth={isMajor ? '1.75' : '1'}
                        strokeLinecap="round"
                      />
                    )
                  })}

                  {/* Hour Hand */}
                  <line
                    x1="50"
                    y1="50"
                    x2={50 + 24 * Math.sin((clockDetails.hourAngle * Math.PI) / 180)}
                    y2={50 - 24 * Math.cos((clockDetails.hourAngle * Math.PI) / 180)}
                    className="stroke-gray-800 dark:stroke-slate-200"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />

                  {/* Minute Hand */}
                  <line
                    x1="50"
                    y1="50"
                    x2={50 + 34 * Math.sin((clockDetails.minuteAngle * Math.PI) / 180)}
                    y2={50 - 34 * Math.cos((clockDetails.minuteAngle * Math.PI) / 180)}
                    className="stroke-gray-600 dark:stroke-slate-400"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />

                  {/* Second Hand (Emerald with tail, GPU transition) */}
                  <line
                    x1={50 - 8 * Math.sin((clockDetails.secondAngle * Math.PI) / 180)}
                    y1={50 + 8 * Math.cos((clockDetails.secondAngle * Math.PI) / 180)}
                    x2={50 + 38 * Math.sin((clockDetails.secondAngle * Math.PI) / 180)}
                    y2={50 - 38 * Math.cos((clockDetails.secondAngle * Math.PI) / 180)}
                    stroke="#10b981"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    style={{
                      transition: 'all 0.2s cubic-bezier(0.4, 2.08, 0.55, 0.44)',
                    }}
                  />

                  {/* Center Pivot Jewel */}
                  <circle cx="50" cy="50" r="2.8" className="fill-emerald-700 dark:fill-emerald-500" />
                  <circle cx="50" cy="50" r="1" className="fill-white dark:fill-slate-900" />
                </svg>
              </div>

              {/* Large Digital Display Card */}
              <div className="flex-1 flex flex-col items-center justify-center p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 shadow-2xs">
                <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-0.5">
                  Standard Time
                </span>

                <div className="flex items-baseline gap-1 font-mono">
                  <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
                    {clockDetails.hoursStr}
                  </span>
                  <span className="text-xl font-light text-emerald-600 dark:text-emerald-400">:</span>
                  <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
                    {clockDetails.minutesStr}
                  </span>
                  <span className="text-xl font-light text-emerald-600 dark:text-emerald-400">:</span>
                  <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                    {clockDetails.secondsStr}
                  </span>
                </div>

                {!is24Hour && (
                  <span className="mt-1 px-2 py-0.2 rounded-full text-[10px] font-bold tracking-wider bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
                    {clockDetails.ampm}
                  </span>
                )}
              </div>
            </div>

            {/* Dual Calendar Date Readout Card (Matches Shamsi Card in Calendar) */}
            <div className="w-full bg-emerald-50/40 dark:bg-slate-800/60 rounded-xl p-3 border border-emerald-200/60 dark:border-slate-700 flex flex-col gap-2">
              {/* Shamsi Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                  <span className="text-[11px] font-semibold text-emerald-950 dark:text-emerald-300">
                    {clockDetails.shamsiText}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                  هجری شمسی
                </span>
              </div>

              {/* Gregorian Row */}
              <div className="flex items-center justify-between pt-1.5 border-t border-emerald-200/50 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-gray-400 dark:text-slate-400" />
                  <span className="text-[11px] font-medium text-gray-700 dark:text-slate-300">
                    {clockDetails.gregText}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                  Gregorian
                </span>
              </div>
            </div>
          </div>

          {/* Footer Bar: Matches exact style and height as DualCalendarPicker footer */}
          <div className="px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800/70 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleCopyTimestamp}
              className="h-6 flex items-center gap-1.5 text-[11px] font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white px-2 py-0.5 rounded-md hover:bg-gray-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Copy formatted timestamp to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-gray-500 dark:text-slate-400" />
                  <span>Copy Timestamp</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 dark:text-slate-500 select-none">Press Esc to close</span>
              <button
                type="button"
                onClick={handleClose}
                className="h-6 px-3 bg-gray-900 dark:bg-[#4A7C6F] hover:bg-black dark:hover:bg-[#3d665b] active:scale-95 text-white font-medium rounded-md text-[11px] transition-all cursor-pointer shadow-2xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SystemClockPicker
