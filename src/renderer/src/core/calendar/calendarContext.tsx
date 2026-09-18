import React, { createContext, useContext, useState } from 'react'
import {
  gregorianToShamsi,
  shamsiToGregorian,
  getShamsiDaysInMonth,
} from './jalali'

export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'this_month_shamsi'
  | 'this_month_gregorian'
  | 'all_time'
  | 'custom'

export type CalendarViewMode = 'dual' | 'shamsi' | 'gregorian'

export interface CalendarRange {
  startDate: Date
  endDate: Date
  activePreset: DatePreset
  preferredView: CalendarViewMode
  setDateRange: (start: Date, end: Date, preset?: DatePreset) => void
  setPreset: (preset: DatePreset) => void
  setPreferredView: (mode: CalendarViewMode) => void
  isDateInRange: (date: Date | string) => boolean
}

const CalendarContext = createContext<CalendarRange | null>(null)

const STORAGE_KEY_VIEW = 'hesabdar_calendar_view_pref'

function getStartOfDay(d: Date): Date {
  const res = new Date(d)
  res.setHours(0, 0, 0, 0)
  return res
}

function getEndOfDay(d: Date): Date {
  const res = new Date(d)
  res.setHours(23, 59, 59, 999)
  return res
}

export function computePresetRange(preset: DatePreset): { start: Date; end: Date } {
  const now = new Date()

  switch (preset) {
    case 'today':
      return { start: getStartOfDay(now), end: getEndOfDay(now) }

    case 'yesterday': {
      const y = new Date(now)
      y.setDate(y.getDate() - 1)
      return { start: getStartOfDay(y), end: getEndOfDay(y) }
    }

    case 'this_week': {
      // Start of week (Saturday in Afghanistan/Middle East)
      const dayOfWeek = now.getDay() // 0 = Sunday, 6 = Saturday
      const diffToSaturday = (dayOfWeek + 1) % 7
      const sat = new Date(now)
      sat.setDate(now.getDate() - diffToSaturday)
      return { start: getStartOfDay(sat), end: getEndOfDay(now) }
    }

    case 'this_month_shamsi': {
      const s = gregorianToShamsi(now)
      const start = shamsiToGregorian(s.jy, s.jm, 1)
      const daysCount = getShamsiDaysInMonth(s.jy, s.jm)
      const end = shamsiToGregorian(s.jy, s.jm, daysCount)
      return { start: getStartOfDay(start), end: getEndOfDay(end) }
    }

    case 'this_month_gregorian': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return { start: getStartOfDay(start), end: getEndOfDay(end) }
    }

    case 'all_time':
    default:
      return {
        start: new Date(2020, 0, 1),
        end: getEndOfDay(now),
      }
  }
}

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const initialRange = computePresetRange('today')
  const [startDate, setStartDate] = useState<Date>(initialRange.start)
  const [endDate, setEndDate] = useState<Date>(initialRange.end)
  const [activePreset, setActivePreset] = useState<DatePreset>('today')
  const [preferredView, setPreferredViewState] = useState<CalendarViewMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VIEW) as CalendarViewMode
      return saved === 'shamsi' || saved === 'gregorian' || saved === 'dual' ? saved : 'dual'
    } catch {
      return 'dual'
    }
  })

  const setPreferredView = (mode: CalendarViewMode) => {
    setPreferredViewState(mode)
    try {
      localStorage.setItem(STORAGE_KEY_VIEW, mode)
    } catch {}
  }

  const setPreset = (preset: DatePreset) => {
    setActivePreset(preset)
    const { start, end } = computePresetRange(preset)
    setStartDate(start)
    setEndDate(end)
  }

  const setDateRange = (start: Date, end: Date, preset: DatePreset = 'custom') => {
    setStartDate(getStartOfDay(start))
    setEndDate(getEndOfDay(end))
    setActivePreset(preset)
  }

  const isDateInRange = (dateInput: Date | string): boolean => {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    const t = d.getTime()
    return t >= startDate.getTime() && t <= endDate.getTime()
  }

  return (
    <CalendarContext.Provider
      value={{
        startDate,
        endDate,
        activePreset,
        preferredView,
        setDateRange,
        setPreset,
        setPreferredView,
        isDateInRange,
      }}
    >
      {children}
    </CalendarContext.Provider>
  )
}

export function useCalendarFilter(): CalendarRange {
  const ctx = useContext(CalendarContext)
  if (!ctx) {
    // Fallback if rendered outside provider
    const fallback = computePresetRange('today')
    return {
      startDate: fallback.start,
      endDate: fallback.end,
      activePreset: 'today',
      preferredView: 'dual',
      setDateRange: () => {},
      setPreset: () => {},
      setPreferredView: () => {},
      isDateInRange: () => true,
    }
  }
  return ctx
}
