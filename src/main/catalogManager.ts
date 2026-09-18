/**
 * catalogManager.ts — Catalog data persistence via userData JSON file.
 *
 * The catalog is stored as `catalog.json` in Electron's userData directory.
 * On first run (or when the file is missing/empty), IPC callers invoke `catalog:seed`
 * which writes all 64+ items to disk. Subsequent reads come from disk only.
 */

import { app } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'

export interface CatalogItem {
  id: string
  barcode: string
  name_en: string
  name_fa: string
  name_ps: string
  unit: string
  category: string
  suggested_cost: number
  suggested_price: number
  default_stock: number
}

function getCatalogFilePath(): string {
  return join(app.getPath('userData'), 'catalog.json')
}

export async function getCatalogItems(): Promise<CatalogItem[]> {
  try {
    const data = await fs.readFile(getCatalogFilePath(), 'utf-8')
    const parsed = JSON.parse(data)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as CatalogItem[]
    }
    return []
  } catch {
    return []
  }
}

export async function seedCatalogItems(items: CatalogItem[]): Promise<{ seeded: number }> {
  try {
    // Only seed if the file doesn't exist or is empty
    const existing = await getCatalogItems()
    if (existing.length > 0) {
      return { seeded: 0 }
    }
    await fs.writeFile(getCatalogFilePath(), JSON.stringify(items, null, 2), 'utf-8')
    return { seeded: items.length }
  } catch (err) {
    console.error('[catalogManager] Failed to seed catalog:', err)
    return { seeded: 0 }
  }
}

export async function searchCatalogItems(query: string): Promise<CatalogItem[]> {
  const all = await getCatalogItems()
  if (!query || !query.trim()) return all
  const q = query.trim().toLowerCase()
  return all.filter(
    (item) =>
      item.name_en.toLowerCase().includes(q) ||
      item.name_fa.toLowerCase().includes(q) ||
      item.name_ps.toLowerCase().includes(q) ||
      item.barcode.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
  )
}
