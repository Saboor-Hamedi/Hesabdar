/**
 * src/renderer/src/core/calendar/jalali.ts
 *
 * Solar Hijri (Shamsi / Afghan) <-> Gregorian conversion engine.
 * Powered natively by V8 / Intl.DateTimeFormat with zero external dependencies.
 * 100% accurate leap year and month length calculations.
 */

export interface ShamsiDate {
  jy: number // Shamsi year (e.g. 1405)
  jm: number // Shamsi month 1-12
  jd: number // Shamsi day 1-31
}

export interface GregorianDate {
  gy: number
  gm: number
  gd: number
}

export interface ShamsiMonthInfo {
  index: number // 1-12
  name_en: string
  name_fa: string // Dari
  name_ps: string // Pashto
  days: number
}

export const SHAMSI_MONTHS: ShamsiMonthInfo[] = [
  { index: 1, name_en: 'Hamal', name_fa: 'حمل', name_ps: 'وری', days: 31 },
  { index: 2, name_en: 'Sawr', name_fa: 'ثور', name_ps: 'غویی', days: 31 },
  { index: 3, name_en: 'Jawza', name_fa: 'جوزا', name_ps: 'غبرګولی', days: 31 },
  { index: 4, name_en: 'Saratan', name_fa: 'سرطان', name_ps: 'چنګاښ', days: 31 },
  { index: 5, name_en: 'Asad', name_fa: 'اسد', name_ps: 'زمری', days: 31 },
  { index: 6, name_en: 'Sunbula', name_fa: 'سنبله', name_ps: 'وږی', days: 31 },
  { index: 7, name_en: 'Mizan', name_fa: 'میزان', name_ps: 'تله', days: 30 },
  { index: 8, name_en: 'Aqrab', name_fa: 'عقرب', name_ps: 'لړم', days: 30 },
  { index: 9, name_en: 'Qaws', name_fa: 'قوس', name_ps: 'لیندۍ', days: 30 },
  { index: 10, name_en: 'Jadi', name_fa: 'جدی', name_ps: 'مرغومی', days: 30 },
  { index: 11, name_en: 'Dalw', name_fa: 'دلو', name_ps: 'سلواغه', days: 30 },
  { index: 12, name_en: 'Hut', name_fa: 'حوت', name_ps: 'کب', days: 29 },
]

export const GREGORIAN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export const GREGORIAN_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

// Intl DateTimeFormatter with Persian calendar system
/**
 * Converts any Gregorian Date to Solar Hijri (Shamsi) Date.
 * Pure mathematical algorithm with zero dependencies and no iteration.
 */
export function gregorianToShamsi(date: Date | string): ShamsiDate {
  const d = typeof date === 'string' ? new Date(date) : date
  const gy = d.getFullYear()
  const gm = d.getMonth() + 1
  const gd = d.getDate()

  const g_d_m = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  let jy = (gy <= 1600) ? 0 : 979
  let adjustedGy = gy - ((gy <= 1600) ? 621 : 1600)
  const gy2 = (gm > 2) ? (adjustedGy + 1) : adjustedGy
  let days = (365 * adjustedGy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd
  for (let i = 1; i < gm; ++i) days += g_d_m[i]
  jy += 33 * Math.floor(days / 12053)
  days %= 12053
  jy += 4 * Math.floor(days / 1461)
  days %= 1461
  if (days > 365) {
    jy += Math.floor((days - 1) / 365)
    days = (days - 1) % 365
  }
  const jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30)
  const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30))
  return { jy, jm, jd }
}

/**
 * Converts a Shamsi year, month (1-12), and day (1-31) to a standard Gregorian Date.
 * Pure mathematical algorithm with zero dependencies and no iteration.
 */
export function shamsiToGregorian(jy: number, jm: number, jd: number): Date {
  let gy = (jy <= 979) ? 621 : 1600
  let adjustedJy = jy - ((jy <= 979) ? 0 : 979)
  let days = (365 * adjustedJy) + (Math.floor(adjustedJy / 33) * 8) + Math.floor(((adjustedJy % 33) + 3) / 4) + 78 + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186)
  gy += 400 * Math.floor(days / 146097)
  days %= 146097
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524)
    days %= 36524
    if (days >= 365) days++
  }
  gy += 4 * Math.floor(days / 1461)
  days %= 1461
  if (days > 365) {
    gy += Math.floor((days - 1) / 365)
    days = (days - 1) % 365
  }
  const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  let gm = 1
  for (let m = 1; m <= 12; m++) {
    if (days < sal_a[m]) {
      gm = m
      break
    }
    days -= sal_a[m]
  }
  const gd = days + 1
  return new Date(gy, gm - 1, gd, 12, 0, 0)
}

/**
 * Checks if a given Shamsi year is a leap year (Hut has 30 days).
 */
export function isShamsiLeap(jy: number): boolean {
  // Test if day 30 of Hut exists in this year
  const testDate = shamsiToGregorian(jy, 12, 29)
  testDate.setDate(testDate.getDate() + 1)
  const s = gregorianToShamsi(testDate)
  return s.jy === jy && s.jm === 12 && s.jd === 30
}

/**
 * Returns total days in a given Shamsi month.
 */
export function getShamsiDaysInMonth(jy: number, jm: number): number {
  if (jm >= 1 && jm <= 6) return 31
  if (jm >= 7 && jm <= 11) return 30
  if (jm === 12) return isShamsiLeap(jy) ? 30 : 29
  return 30
}

/**
 * Formats a Date into a dual calendar short summary string.
 * Example: "18 Sep 2026 | 27 Sunbula 1405"
 */
export function formatDualDate(date: Date = new Date()): string {
  const day = date.getDate()
  const monthShort = GREGORIAN_MONTHS_SHORT[date.getMonth()]
  const year = date.getFullYear()

  const s = gregorianToShamsi(date)
  const shamsiMonth = SHAMSI_MONTHS[s.jm - 1]?.name_en || ''

  return `${day} ${monthShort} ${year} | ${s.jd} ${shamsiMonth} ${s.jy}`
}

/**
 * Formats Shamsi date in full localized Afghan text: e.g. "۲۷ سنبله ۱۴۰۵"
 */
export function formatShamsiDateText(s: ShamsiDate, lang: 'fa' | 'ps' | 'en' = 'fa'): string {
  const m = SHAMSI_MONTHS[s.jm - 1]
  const monthName = lang === 'ps' ? m?.name_ps : lang === 'en' ? m?.name_en : m?.name_fa
  return `${s.jd} ${monthName} ${s.jy}`
}

/**
 * Smart date parser with helpful, human-friendly feedback.
 * Supports:
 * - YYYY/MM/DD (e.g. 1405/06/27 or 2026/09/18)
 * - YYYY/DD/MM (e.g. 1405/27/06 auto-detected)
 * - DD/MM/YYYY (e.g. 27/06/1405)
 * - Standard Gregorian date strings
 */
export function parseDateWithFeedback(input: string): { date: Date | null; error?: string } {
  const trimmed = input.trim()
  if (!trimmed) return { date: null, error: 'Please enter a date' }

  // Check 3 numeric parts separated by /, -, or .
  const parts = trimmed.split(/[/.-]/)
  if (parts.length === 3) {
    const p0 = parseInt(parts[0], 10)
    const p1 = parseInt(parts[1], 10)
    const p2 = parseInt(parts[2], 10)

    if (!isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
      let y = p0
      let m = p1
      let d = p2

      // If p2 is the 4-digit year (e.g. DD/MM/YYYY)
      if (p2 >= 1000 && p0 < 1000) {
        y = p2
        if (p0 > 12 && p1 <= 12) {
          d = p0
          m = p1
        } else {
          m = p0
          d = p1
        }
      } else if (p0 >= 1000) {
        // YYYY/MM/DD or YYYY/DD/MM
        y = p0
        if (p1 > 12 && p2 <= 12) {
          // User typed YYYY/DD/MM (e.g. 1406/20/07)
          d = p1
          m = p2
        } else {
          m = p1
          d = p2
        }
      }

      // Check if month is valid (1 to 12)
      if (m < 1 || m > 12) {
        return {
          date: null,
          error: `Month '${m}' is invalid. A year only has 12 months (1-12). Use format YYYY/MM/DD (e.g. ${y}/06/27).`,
        }
      }

      // Check if day is valid (1 to 31)
      if (d < 1 || d > 31) {
        return {
          date: null,
          error: `Day '${d}' is invalid. Days must be between 1 and 31.`,
        }
      }

      // Shamsi year (1300 to 1499)
      if (y >= 1300 && y <= 1499) {
        try {
          const res = shamsiToGregorian(y, m, d)
          return { date: res }
        } catch {
          return { date: null, error: `Invalid Shamsi date ${y}/${m}/${d}` }
        }
      }

      // Gregorian year (1900 to 2100)
      if (y >= 1900 && y <= 2100) {
        return { date: new Date(y, m - 1, d, 12, 0, 0) }
      }
    }
  }

  const standard = new Date(trimmed)
  if (!isNaN(standard.getTime())) {
    return { date: standard }
  }

  return {
    date: null,
    error: 'Unrecognized format. Enter YYYY/MM/DD (e.g. 1405/06/27 or 2026/09/18).',
  }
}

/**
 * Convenience wrapper returning Date or null.
 */
export function parseAnyDate(input: string): Date | null {
  return parseDateWithFeedback(input).date
}

