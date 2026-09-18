/**
 * src/renderer/src/core/utils/printerDetection.ts
 *
 * Smart thermal/receipt printer auto-detection logic:
 * Scans connected printers for thermal POS keywords (CARAVPOS, POS-80, Thermal, etc.)
 * and automatically prioritizes them over virtual PDF or office desktop printers.
 */

export interface DetectedPrinterInfo {
  name: string
  displayName: string
  isDefault: boolean
  isThermal: boolean
}

const THERMAL_KEYWORDS = [
  'carav',
  'china 260',
  'pos 80',
  'pos-80',
  'pos80',
  'pos 58',
  'pos-58',
  'pos58',
  'thermal',
  'receipt',
  'xp-',
  'rp-',
  'xprinter',
  'bixolon',
  'rongta',
  'epson tm',
  'tm-t',
  'star tsp',
  'sprt',
  'hprt',
  'gprinter',
  'zywell',
  'sunmi',
]

const VIRTUAL_KEYWORDS = [
  'pdf',
  'onenote',
  'fax',
  'xps',
  'document writer',
  'root print queue',
]

/**
 * Checks if a printer's name or display name matches known thermal POS printers
 */
export function isThermalPrinterName(name: string): boolean {
  if (!name) return false
  const lower = name.toLowerCase()
  return THERMAL_KEYWORDS.some((kw) => lower.includes(kw))
}

/**
 * Checks if a printer is a virtual / software printer (PDF, OneNote, Fax)
 */
export function isVirtualPrinterName(name: string): boolean {
  if (!name) return false
  const lower = name.toLowerCase()
  return VIRTUAL_KEYWORDS.some((kw) => lower.includes(kw))
}

/**
 * Analyzes printer list and selects the optimal printer:
 * 1. Previously saved preference in localStorage (if it still exists in the system)
 * 2. Any detected thermal receipt printer (e.g., CARAVPOS, POS-80, Thermal Receipt)
 * 3. System default printer (if physical and not virtual)
 * 4. Any physical printer
 * 5. Fallback to system default or first available printer
 */
export function detectBestPrinter(
  printers: Array<{ name: string; displayName?: string; isDefault: boolean }>
): {
  selectedName: string
  isThermal: boolean
  annotatedPrinters: DetectedPrinterInfo[]
} {
  if (!printers || printers.length === 0) {
    return {
      selectedName: '',
      isThermal: false,
      annotatedPrinters: [],
    }
  }

  const annotatedPrinters: DetectedPrinterInfo[] = printers.map((p) => {
    const fullName = `${p.displayName || ''} ${p.name || ''}`
    return {
      name: p.name,
      displayName: p.displayName || p.name,
      isDefault: Boolean(p.isDefault),
      isThermal: isThermalPrinterName(fullName),
    }
  })

  // 1. Saved preference in localStorage
  const saved = localStorage.getItem('hesabdar_selected_printer')
  if (saved) {
    const match = annotatedPrinters.find((p) => p.name === saved)
    if (match) {
      return {
        selectedName: match.name,
        isThermal: match.isThermal,
        annotatedPrinters,
      }
    }
  }

  // 2. Detected Thermal / POS printer (e.g. CARAVPOS, POS-80)
  const thermalMatch = annotatedPrinters.find((p) => p.isThermal)
  if (thermalMatch) {
    return {
      selectedName: thermalMatch.name,
      isThermal: true,
      annotatedPrinters,
    }
  }

  // 3. System default printer (if not virtual)
  const defaultNonVirtual = annotatedPrinters.find((p) => p.isDefault && !isVirtualPrinterName(p.name))
  if (defaultNonVirtual) {
    return {
      selectedName: defaultNonVirtual.name,
      isThermal: defaultNonVirtual.isThermal,
      annotatedPrinters,
    }
  }

  // 4. Any physical non-virtual printer
  const physical = annotatedPrinters.find((p) => !isVirtualPrinterName(p.name))
  if (physical) {
    return {
      selectedName: physical.name,
      isThermal: physical.isThermal,
      annotatedPrinters,
    }
  }

  // 5. Fallback to system default or first item
  const fallback = annotatedPrinters.find((p) => p.isDefault) || annotatedPrinters[0]
  return {
    selectedName: fallback.name,
    isThermal: fallback.isThermal,
    annotatedPrinters,
  }
}
